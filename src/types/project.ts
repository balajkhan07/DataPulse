import type { ColumnMapping, MissingValueStrategy, RawDataRow } from "@/types/data";
import type { AudioConfig, ExportConfig } from "@/types/export";
import type { StoryAssistantConfig } from "@/types/assistant";
import type { EventSettings, TimelineConfig } from "@/types/story";

export type AspectRatioPreset = "portrait" | "landscape" | "square" | "feed";
export type ValueFormat = "raw" | "integer" | "compact" | "currency" | "percentage";
export type VideoMode = "short-form" | "long-form" | "custom";
export type EntityImageStyle = "circle" | "rounded" | "square";

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
  imageStyle: EntityImageStyle;
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
  mode: VideoMode;
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

export interface SourceMetadata {
  name: string;
  url: string;
  publisher: string;
  retrievedDate: string;
  notes: string;
  licenseNotes: string;
}

export interface PublishingContent {
  youtubeDescription: string;
  shortCaption: string;
  socialCaption: string;
  sourceAttribution: string;
  finalTakeaway: string;
}

export interface ProjectConfig {
  schemaVersion: 4;
  id: string;
  name: string;
  visualizationType: "bar-chart-race";
  dataset: {
    name: string;
    mapping: ColumnMapping;
    rows: RawDataRow[];
  };
  content: ContentConfig;
  sourceMetadata: SourceMetadata;
  publishing: PublishingContent;
  story: StoryAssistantConfig;
  visualization: BarChartRaceConfig;
  themeId: string;
  video: VideoConfig;
  timeline: TimelineConfig;
  events: EventSettings;
  export: ExportConfig;
  audio: AudioConfig;
  createdAt: string;
  updatedAt: string;
}
