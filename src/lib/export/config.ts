import { getExportPreset } from "@/lib/export/presets";
import { getTimelineDuration } from "@/lib/timeline/timeline";
import type { ExportConfig } from "@/types/export";
import type { AspectRatioPreset, ProjectConfig, SafeAreaConfig } from "@/types/project";

export function sanitizeExportFilename(value: string): string {
  const base = value.trim().replace(/\.mp4$/i, "");
  const sanitized = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/[._ -]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 120);
  return `${sanitized || "datapulse-story"}.mp4`;
}

export function inferAspectRatio(width: number, height: number): AspectRatioPreset {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.02) return "square";
  if (Math.abs(ratio - 0.8) < 0.02) return "feed";
  return ratio < 1 ? "portrait" : "landscape";
}

function scaledSafeArea(project: ProjectConfig, config: ExportConfig): SafeAreaConfig {
  const preset = getExportPreset(config.presetId);
  if (preset && preset.width === config.width && preset.height === config.height) return { ...preset.safeArea };
  return {
    top: Math.round(project.video.safeArea.top * (config.height / project.video.height)),
    right: Math.round(project.video.safeArea.right * (config.width / project.video.width)),
    bottom: Math.round(project.video.safeArea.bottom * (config.height / project.video.height)),
    left: Math.round(project.video.safeArea.left * (config.width / project.video.width)),
  };
}

export function prepareProjectForExport(project: ProjectConfig, config: ExportConfig): ProjectConfig {
  const fpsRatio = config.fps / project.video.fps;
  return {
    ...project,
    video: {
      ...project.video,
      width: config.width,
      height: config.height,
      fps: config.fps,
      aspectRatio: inferAspectRatio(config.width, config.height),
      safeArea: scaledSafeArea(project, config),
    },
    timeline: {
      scenes: project.timeline.scenes.map((scene) => ({
        ...scene,
        durationFrames: Math.max(1, Math.round(scene.durationFrames * fpsRatio)),
        entryTransition: {
          ...scene.entryTransition,
          durationFrames: Math.max(0, Math.round(scene.entryTransition.durationFrames * fpsRatio)),
        },
      })),
    },
    events: {
      ...project.events,
      durationFrames: Math.max(1, Math.round(project.events.durationFrames * fpsRatio)),
    },
    export: { ...config, filename: sanitizeExportFilename(config.filename) },
  };
}

export function getExportMetrics(project: ProjectConfig, config: ExportConfig): { frameCount: number; durationSeconds: number } {
  const prepared = prepareProjectForExport(project, config);
  const frameCount = getTimelineDuration(prepared.timeline);
  return { frameCount, durationSeconds: frameCount / config.fps };
}
