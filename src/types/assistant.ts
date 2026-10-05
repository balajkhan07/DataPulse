import type { DatasetAnalysis } from "@/types/analysis";
import type { ProjectConfig, VideoMode } from "@/types/project";
import type { StoryEventType, StoryScene, TimelineConfig } from "@/types/story";

export type StoryRecommendationMode = "short-form" | "long-form" | "either";
export type AdaptivePacingIntensity = "low" | "medium" | "high";
export type StoryPresetId =
  | "fast-race"
  | "story-short"
  | "dramatic-rise-fall"
  | "data-documentary"
  | "ranking-history"
  | "rise-and-fall"
  | "head-to-head"
  | "decade-by-decade";

export interface StoryCandidate {
  id: string;
  angle: string;
  explanation: string;
  primaryEntityIds: string[];
  relevantEventIds: string[];
  score: number;
  suggestedVideoMode: StoryRecommendationMode;
}

export interface HookSuggestion {
  id: string;
  text: string;
  type: "question" | "transformation" | "dominance" | "surprise" | "comeback";
  targetEntityIds: string[];
  targetEventId?: string;
  recommendedFor: StoryRecommendationMode;
  score: number;
  reason: string;
}

export interface TitleSuggestion {
  id: string;
  text: string;
  style: "neutral" | "curiosity" | "story" | "social";
  score: number;
  reason: string;
}

export interface GeneratedDescriptions {
  youtubeDescription: string;
  shortCaption: string;
  socialCaption: string;
  sourceAttribution: string;
}

export interface AnnotationSuggestion {
  eventId: string;
  eventType: StoryEventType;
  text: string;
  reason: string;
  importance: number;
}

export interface StoryAssistantConfig {
  analysisVersion: 1;
  generationSeed: number;
  selectedCandidateId: string | null;
  selectedHookId: string | null;
  selectedTitleId: string | null;
  presetId: StoryPresetId;
  adaptivePacing: {
    enabled: boolean;
    intensity: AdaptivePacingIntensity;
  };
}

export interface GeneratedStoryDraft {
  id: string;
  name: string;
  videoMode: VideoMode;
  presetId: StoryPresetId;
  timeline: TimelineConfig;
  selectedEventIds: string[];
  explanation: string;
}

export interface QualityCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  suggestion?: string;
}

export interface ContentQualityReport {
  score: number;
  checks: QualityCheck[];
  warnings: string[];
  draftSignature: string;
}

export interface StoryGenerationInput {
  project: ProjectConfig;
  analysis: DatasetAnalysis;
  seed?: number;
}

export interface StoryDraftOptions {
  presetId: StoryPresetId;
  candidateId?: string | null;
  hookId?: string | null;
  titleId?: string | null;
  seed?: number;
}

export interface ContentAIProvider {
  id: string;
  generateHooks(input: StoryGenerationInput): Promise<HookSuggestion[]>;
  generateTitles(input: StoryGenerationInput): Promise<TitleSuggestion[]>;
  generateStoryOutline(input: StoryGenerationInput, options: StoryDraftOptions): Promise<GeneratedStoryDraft>;
  generateDescription(input: StoryGenerationInput): Promise<GeneratedDescriptions>;
}

export type GeneratedScene = StoryScene;
