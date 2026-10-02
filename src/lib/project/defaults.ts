import type { BarChartRaceConfig, ProjectConfig, VideoConfig } from "@/types/project";

export const defaultBarChartRaceConfig: BarChartRaceConfig = {
  topN: 8,
  showRank: true,
  showValues: true,
  showImages: false,
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

export function createDefaultProject(): ProjectConfig {
  const now = new Date(0).toISOString();
  return {
    schemaVersion: 1,
    id: "demo-project",
    name: "Global Tech Leaders",
    visualizationType: "bar-chart-race",
    dataset: {
      name: "Global Tech Leaders",
      mapping: { time: "year", category: "company", value: "value" },
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
      fps: 30,
      aspectRatio: "portrait",
    },
    createdAt: now,
    updatedAt: now,
  };
}
