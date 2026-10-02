import type { ColumnMapping, MissingValueStrategy } from "@/types/data";

export type AspectRatioPreset = "portrait" | "landscape" | "square" | "feed";
export type ValueFormat = "raw" | "integer" | "compact" | "currency" | "percentage";

export interface SafeAreaConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BarChartRaceConfig {
  topN: number;
  showRank: boolean;
  showValues: boolean;
  showImages: boolean;
  barRadius: number;
  barOpacity: number;
  valueFormat: ValueFormat;
  valuePrefix: string;
  valueSuffix: string;
  currency: string;
  missingValueStrategy: MissingValueStrategy;
  secondsPerPeriod: number;
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: 24 | 30 | 60;
  aspectRatio: AspectRatioPreset;
  safeArea: SafeAreaConfig;
}

export interface ContentConfig {
  title: string;
  subtitle: string;
  source: string;
  footer: string;
}

export interface ProjectConfig {
  schemaVersion: 1;
  id: string;
  name: string;
  visualizationType: "bar-chart-race";
  dataset: {
    name: string;
    mapping: ColumnMapping;
  };
  content: ContentConfig;
  visualization: BarChartRaceConfig;
  themeId: string;
  video: VideoConfig;
  createdAt: string;
  updatedAt: string;
}
