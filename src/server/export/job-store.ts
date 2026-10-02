import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { getExportMetrics, prepareProjectForExport } from "@/lib/export/config";
import type { ExportConfig, RenderJob } from "@/types/export";
import type { ProjectConfig } from "@/types/project";
import { ensureExportDirectories, exportDirectory, jobDirectory, jobHistoryPath } from "@/server/export/paths";

export interface RenderJobSnapshot {
  project: ProjectConfig;
  config: ExportConfig;
}

let writeChain = Promise.resolve();

async function readJobsUnsafe(): Promise<RenderJob[]> {
  await ensureExportDirectories();
  try {
    const parsed: unknown = JSON.parse(await readFile(jobHistoryPath, "utf8"));
    return Array.isArray(parsed) ? parsed as RenderJob[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    return [];
  }
}

async function writeJobsUnsafe(jobs: RenderJob[]): Promise<void> {
  const temporary = `${jobHistoryPath}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(jobs.slice(0, 100), null, 2));
  await rename(temporary, jobHistoryPath);
}

export async function listRenderJobs(): Promise<RenderJob[]> {
  await writeChain;
  return readJobsUnsafe();
}

export async function getRenderJob(jobId: string): Promise<RenderJob | null> {
  return (await listRenderJobs()).find((job) => job.id === jobId) ?? null;
}

export async function updateRenderJob(jobId: string, patch: Partial<RenderJob>): Promise<RenderJob | null> {
  let result: RenderJob | null = null;
  const operation = writeChain.then(async () => {
    const jobs = await readJobsUnsafe();
    const index = jobs.findIndex((job) => job.id === jobId);
    if (index < 0) return;
    result = { ...jobs[index], ...patch };
    jobs[index] = result;
    await writeJobsUnsafe(jobs);
  });
  writeChain = operation.catch(() => undefined);
  await operation;
  return result;
}

export async function createRenderJob(project: ProjectConfig, config: ExportConfig): Promise<RenderJob> {
  const prepared = prepareProjectForExport(project, config);
  const metrics = getExportMetrics(project, config);
  const job: RenderJob = {
    id: randomUUID(),
    projectId: project.id,
    projectName: project.name,
    status: "queued",
    progress: 0,
    stage: "Waiting for the local renderer",
    config: prepared.export,
    durationSeconds: metrics.durationSeconds,
    frameCount: metrics.frameCount,
    warnings: [],
    createdAt: new Date().toISOString(),
  };
  const operation = writeChain.then(async () => {
    const jobs = await readJobsUnsafe();
    if (jobs.some((candidate) => candidate.projectId === project.id && ["queued", "preparing", "rendering", "encoding", "finalizing"].includes(candidate.status))) {
      throw new Error("This project already has an active render job.");
    }
    await writeFile(path.join(jobDirectory, `${job.id}.json`), JSON.stringify({ project, config } satisfies RenderJobSnapshot));
    await writeJobsUnsafe([job, ...jobs]);
  });
  writeChain = operation.catch(() => undefined);
  await operation;
  return job;
}

export async function readRenderJobSnapshot(jobId: string): Promise<RenderJobSnapshot> {
  const contents = await readFile(path.join(jobDirectory, `${jobId}.json`), "utf8");
  return JSON.parse(contents) as RenderJobSnapshot;
}

export async function chooseOutputPath(filename: string): Promise<string> {
  await ensureExportDirectories();
  const extension = path.extname(filename);
  const base = path.basename(filename, extension);
  for (let suffix = 0; suffix < 10_000; suffix += 1) {
    const candidate = path.join(exportDirectory, `${base}${suffix === 0 ? "" : `-${suffix + 1}`}${extension}`);
    try { await stat(candidate); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return candidate;
      throw error;
    }
  }
  throw new Error("Could not choose a unique export filename.");
}

export function publicRenderJob(job: RenderJob): RenderJob {
  const publicJob = { ...job };
  delete publicJob.outputPath;
  return publicJob;
}
