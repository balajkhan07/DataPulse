import type { BarChartRaceConfig, ProjectConfig, VideoConfig, VideoMode } from "@/types/project";
import { createDefaultExportConfig } from "@/lib/export/presets";
import type { AudioConfig } from "@/types/export";
import type { EventSettings, StoryScene, TimelineConfig } from "@/types/story";

export const defaultBarChartRaceConfig: BarChartRaceConfig = {
  topN: 8,
  showRank: true,
  showValues: true,
  showImages: false,
  imageStyle: "circle",
  barRadius: 14,
  barOpacity: 1,
  valueFormat: "compact",
  valuePrefix: "",
  valueSuffix: "",
  currency: "USD",
  missingValueStrategy: "zero",
  secondsPerPeriod: 1.4,
  easing: "easeInOut",
};

export const videoPresets: Record<VideoConfig["aspectRatio"], Pick<VideoConfig, "width" | "height" | "safeArea">> = {
  portrait: { width: 1080, height: 1920, safeArea: { top: 120, right: 116, bottom: 220, left: 80 } },
  landscape: { width: 1920, height: 1080, safeArea: { top: 72, right: 120, bottom: 84, left: 120 } },
  square: { width: 1080, height: 1080, safeArea: { top: 72, right: 72, bottom: 84, left: 72 } },
  feed: { width: 1080, height: 1350, safeArea: { top: 84, right: 76, bottom: 120, left: 76 } },
};

export const defaultEventSettings: EventSettings = {
  enabled: true,
  enabledTypes: ["lead-change", "major-rise", "major-fall", "top-entry", "top-exit", "record-value", "milestone"],
  frequency: "medium",
  minimumImportance: 68,
  durationFrames: 84,
  topN: 8,
  majorRankChange: 3,
  milestones: [],
};

export const defaultAudioConfig: AudioConfig = {
  enabled: false,
  assetId: null,
  fileName: null,
  mimeType: null,
  durationSeconds: null,
  startOffsetSeconds: 0,
  trimStartSeconds: 0,
  trimEndSeconds: null,
  volume: 0.72,
  fadeInSeconds: 1,
  fadeOutSeconds: 1.5,
  loop: false,
};

export function createDefaultTimeline(
  fps: number,
  visualizationFrames = fps * 12,
  mode: VideoMode = "short-form",
): TimelineConfig {
  const longForm = mode === "long-form";
  const scenes: StoryScene[] = [
    {
      id: "scene-hook",
      type: "hook",
      enabled: true,
      durationFrames: fps * (longForm ? 5 : 2),
      entryTransition: { type: "cut", durationFrames: 0 },
      config: {
        title: "The Race to Define Technology",
        subtitle: "Global brand value, 2018–2025",
        hookText: "Watch the balance of power shift.",
        background: "spotlight",
        transition: "rise",
      },
    },
    {
      id: "scene-visualization",
      type: "visualization",
      enabled: true,
      durationFrames: longForm ? Math.round(visualizationFrames * 1.8) : visualizationFrames,
      entryTransition: { type: "crossfade", durationFrames: Math.round(fps * 0.45) },
      config: { annotationsEnabled: true },
    },
    {
      id: "scene-final",
      type: "final-ranking",
      enabled: true,
      durationFrames: fps * (longForm ? 6 : 3),
      entryTransition: { type: "slide", durationFrames: Math.round(fps * 0.4) },
      config: { title: "Final ranking", topN: 8, showValues: true, showImages: true },
    },
    {
      id: "scene-outro",
      type: "outro",
      enabled: true,
      durationFrames: fps * (longForm ? 4 : 2),
      entryTransition: { type: "fade", durationFrames: Math.round(fps * 0.45) },
      config: { title: "The data keeps moving.", cta: "What should we explore next?" },
    },
  ];
  return { scenes };
}

export function createDefaultProject(): ProjectConfig {
  const now = new Date(0).toISOString();
  const fps = 30;
  return {
    schemaVersion: 3,
    id: "demo-project",
    name: "Global Tech Leaders",
    visualizationType: "bar-chart-race",
    dataset: {
      name: "Global Tech Leaders",
      mapping: { time: "year", category: "company", value: "value" },
      rows: [],
    },
    content: {
      title: "The Race to Define Technology",
      subtitle: "Global brand value, 2018–2025",
      source: "Sample data · DataPulse",
      footer: "A changing leaderboard, frame by frame",
    },
    visualization: { ...defaultBarChartRaceConfig },
    themeId: "modern-dark",
    video: {
      ...videoPresets.portrait,
      fps,
      mode: "short-form",
      aspectRatio: "portrait",
    },
    timeline: createDefaultTimeline(fps),
    events: { ...defaultEventSettings },
    export: createDefaultExportConfig("global-tech-leaders.mp4"),
    audio: { ...defaultAudioConfig },
    createdAt: now,
    updatedAt: now,
  };
}
