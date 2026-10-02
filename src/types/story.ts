export type SceneType = "hook" | "visualization" | "final-ranking" | "outro";

interface BaseStoryScene<TType extends SceneType, TConfig> {
  id: string;
  type: TType;
  enabled: boolean;
  durationFrames: number;
  config: TConfig;
}

export interface HookSceneConfig {
  title: string;
  subtitle: string;
  hookText: string;
  background: "spotlight" | "gradient" | "solid";
  transition: "fade" | "rise";
}

export interface VisualizationSceneConfig {
  annotationsEnabled: boolean;
}

export interface FinalRankingSceneConfig {
  title: string;
  topN: number;
  showValues: boolean;
  showImages: boolean;
}

export interface OutroSceneConfig {
  title: string;
  cta: string;
}

export type StoryScene =
  | BaseStoryScene<"hook", HookSceneConfig>
  | BaseStoryScene<"visualization", VisualizationSceneConfig>
  | BaseStoryScene<"final-ranking", FinalRankingSceneConfig>
  | BaseStoryScene<"outro", OutroSceneConfig>;

export interface TimelineConfig {
  scenes: StoryScene[];
}

export type StoryEventType =
  | "lead-change"
  | "major-rise"
  | "major-fall"
  | "top-entry"
  | "top-exit"
  | "record-value"
  | "milestone"
  | "fastest-growth";

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  time: number;
  timeLabel: string;
  periodIndex: number;
  entityIds: string[];
  importance: number;
  data: Record<string, string | number | boolean>;
}

export interface EventSettings {
  enabled: boolean;
  enabledTypes: StoryEventType[];
  frequency: "low" | "medium" | "high";
  minimumImportance: number;
  durationFrames: number;
  topN: number;
  majorRankChange: number;
  milestones: number[];
}

export interface EventPresentation {
  title: string;
  description?: string;
}

export interface ScheduledAnnotation extends EventPresentation {
  eventId: string;
  eventType: StoryEventType;
  startFrame: number;
  durationFrames: number;
  entityIds: string[];
  importance: number;
}
