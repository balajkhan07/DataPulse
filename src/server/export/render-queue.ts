import "server-only";
import { access, rm, stat } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { makeCancelSignal, renderMedia, selectComposition } from "@remotion/renderer";
import { prepareProjectForExport } from "@/lib/export/config";
import { exportQualityProfiles } from "@/lib/export/presets";
import { resolveRenderAssets } from "@/server/export/assets";
import { chooseOutputPath, getRenderJob, readRenderJobSnapshot, updateRenderJob } from "@/server/export/job-store";

interface RenderQueueState {
  pending: string[];
  running: boolean;
  activeJobId: string | null;
  cancel: (() => void) | null;
}

declare global {
  var __dataPulseRenderQueue: RenderQueueState | undefined;
}

const state = globalThis.__dataPulseRenderQueue ??= { pending: [], running: false, activeJobId: null, cancel: null };

async function browserExecutable(): Promise<string | undefined> {
  const configured = process.env.REMOTION_BROWSER_EXECUTABLE;
  const candidates = configured ? [configured] : [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next browser. */ }
  }
  return undefined;
}

async function assertNotCancelled(jobId: string): Promise<void> {
  if ((await getRenderJob(jobId))?.status === "cancelled") throw new Error("RENDER_CANCELLED");
}

async function runJob(jobId: string): Promise<void> {
  const started = Date.now();
  let temporaryDirectory: string | null = null;
  try {
    await updateRenderJob(jobId, { status: "preparing", progress: 0.01, stage: "Validating project and resolving assets", startedAt: new Date().toISOString() });
    const snapshot = await readRenderJobSnapshot(jobId);
    const preparedProject = prepareProjectForExport(snapshot.project, snapshot.config);
    const assets = await resolveRenderAssets(preparedProject, jobId);
    temporaryDirectory = assets.temporaryDirectory;
    await updateRenderJob(jobId, { warnings: assets.warnings, progress: 0.03, stage: "Bundling the shared renderer" });
    await assertNotCancelled(jobId);

    const serveUrl = await bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.tsx"),
      publicDir: assets.publicDirectory,
      rootDir: process.cwd(),
      webpackOverride: (configuration) => ({
        ...configuration,
        resolve: {
          ...configuration.resolve,
          alias: { ...configuration.resolve?.alias, "@": path.join(process.cwd(), "src") },
        },
      }),
      onProgress: (progress) => {
        const normalizedProgress = progress > 1 ? progress / 100 : progress;
        void updateRenderJob(jobId, { progress: 0.03 + normalizedProgress * 0.06, stage: "Bundling the shared renderer" });
      },
    });
    await assertNotCancelled(jobId);
    const inputProps = { project: assets.project, audioSource: assets.audioSource };
    const executable = await browserExecutable();
    const composition = await selectComposition({
      serveUrl,
      id: "DataPulseStory",
      inputProps,
      browserExecutable: executable,
      logLevel: "warn",
    });
    const outputPath = await chooseOutputPath(preparedProject.export.filename);
    const quality = exportQualityProfiles[snapshot.config.quality];
    const cancellation = makeCancelSignal();
    state.cancel = cancellation.cancel;
    await updateRenderJob(jobId, { status: "rendering", progress: 0.1, stage: `Rendering ${composition.durationInFrames.toLocaleString()} deterministic frames` });
    let lastProgressWrite = 0;
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      outputLocation: outputPath,
      codec: "h264",
      audioCodec: "aac",
      audioBitrate: "192k",
      crf: quality.crf,
      jpegQuality: quality.jpegQuality,
      x264Preset: quality.x264Preset,
      pixelFormat: "yuv420p",
      imageFormat: "jpeg",
      browserExecutable: executable,
      cancelSignal: cancellation.cancelSignal,
      overwrite: false,
      logLevel: "warn",
      onProgress: (progress) => {
        const now = Date.now();
        if (now - lastProgressWrite < 500 && progress.progress < 1) return;
        lastProgressWrite = now;
        const framesComplete = progress.renderedFrames >= composition.durationInFrames;
        void updateRenderJob(jobId, {
          status: framesComplete ? "encoding" : "rendering",
          progress: Math.min(0.96, 0.1 + progress.progress * 0.86),
          stage: framesComplete
            ? "Encoding and muxing H.264/AAC MP4"
            : `Rendering frame ${Math.min(progress.renderedFrames, composition.durationInFrames).toLocaleString()} of ${composition.durationInFrames.toLocaleString()}`,
        });
      },
    });
    await updateRenderJob(jobId, { status: "finalizing", progress: 0.98, stage: "Verifying the rendered file" });
    const metadata = await stat(outputPath);
    await updateRenderJob(jobId, {
      status: "completed",
      progress: 1,
      stage: "MP4 ready",
      outputPath,
      outputBytes: metadata.size,
      completedAt: new Date().toISOString(),
      renderDurationMs: Date.now() - started,
    });
  } catch (error) {
    const cancelled = (error instanceof Error && error.message === "RENDER_CANCELLED") || (await getRenderJob(jobId))?.status === "cancelled";
    const failurePatch = {
      status: cancelled ? "cancelled" : "failed",
      stage: cancelled ? "Render cancelled" : "Render failed",
      error: cancelled ? undefined : error instanceof Error ? error.message : "The renderer failed for an unknown reason.",
      completedAt: new Date().toISOString(),
      renderDurationMs: Date.now() - started,
    } as const;
    await updateRenderJob(jobId, cancelled ? { ...failurePatch, progress: 0 } : failurePatch);
  } finally {
    state.cancel = null;
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function drainQueue(): Promise<void> {
  if (state.running) return;
  state.running = true;
  try {
    while (state.pending.length > 0) {
      const jobId = state.pending.shift();
      if (!jobId) continue;
      state.activeJobId = jobId;
      if ((await getRenderJob(jobId))?.status !== "cancelled") await runJob(jobId);
      state.activeJobId = null;
    }
  } finally {
    state.activeJobId = null;
    state.running = false;
  }
}

export function enqueueRenderJob(jobId: string): void {
  if (!state.pending.includes(jobId) && state.activeJobId !== jobId) state.pending.push(jobId);
  void drainQueue();
}

export async function cancelRenderJob(jobId: string): Promise<boolean> {
  const job = await getRenderJob(jobId);
  if (!job || ["completed", "failed", "cancelled"].includes(job.status)) return false;
  const active = state.activeJobId === jobId;
  await updateRenderJob(jobId, { status: "cancelled", stage: active ? "Cancelling render" : "Render cancelled", error: undefined, completedAt: new Date().toISOString() });
  if (active) state.cancel?.();
  return true;
}
