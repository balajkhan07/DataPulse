import { z } from "zod";
import {
  createDefaultProject,
  defaultAudioConfig,
  defaultEventSettings,
  defaultStoryAssistantConfig,
} from "@/lib/project/defaults";
import type { ProjectConfig, SourceMetadata } from "@/types/project";

const rawValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const rawRowSchema = z.record(z.string(), rawValueSchema);

const mappingSchema = z.object({
  time: z.string().min(1),
  category: z.string().min(1),
  value: z.string().min(1),
  displayLabel: z.string().optional(),
  group: z.string().optional(),
  color: z.string().optional(),
  image: z.string().optional(),
  secondaryMetric: z.string().optional(),
  description: z.string().optional(),
});

const visualizationSchema = z.object({
  topN: z.number().int().min(3).max(20),
  showRank: z.boolean(),
  showValues: z.boolean(),
  showImages: z.boolean(),
  imageStyle: z.enum(["circle", "rounded", "square"]),
  barRadius: z.number().min(0).max(40),
  barOpacity: z.number().min(0.2).max(1),
  valueFormat: z.enum(["raw", "integer", "compact", "currency", "percentage"]),
  valuePrefix: z.string(),
  valueSuffix: z.string(),
  currency: z.string().length(3),
  missingValueStrategy: z.enum(["zero", "carry"]),
  secondsPerPeriod: z.number().min(0.2).max(10),
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]),
});

const videoSchema = z.object({
  mode: z.enum(["short-form", "long-form", "custom"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  aspectRatio: z.enum(["portrait", "landscape", "square", "feed"]),
  safeArea: z.object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() }),
});

const sceneTransitionSchema = z.object({
  type: z.enum(["cut", "fade", "crossfade", "slide"]),
  durationFrames: z.number().int().min(0),
});

const hookSceneFields = {
  title: z.string(),
  subtitle: z.string(),
  hookText: z.string(),
  background: z.enum(["spotlight", "gradient", "solid"]),
  transition: z.enum(["fade", "rise"]),
};

const finalRankingFields = {
  title: z.string(),
  topN: z.number().int().min(1).max(20),
  showValues: z.boolean(),
  showImages: z.boolean(),
};

const storySceneSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hook"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object(hookSceneFields) }),
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({ eyebrow: z.string(), title: z.string(), body: z.string(), kind: z.enum(["context", "insight", "takeaway"]) }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("visualization"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({
      annotationsEnabled: z.boolean(),
      periodStartIndex: z.number().int().min(0).nullable(),
      periodEndIndex: z.number().int().min(0).nullable(),
    }),
  }),
  z.object({ id: z.string().min(1), type: z.literal("final-ranking"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object(finalRankingFields) }),
  z.object({ id: z.string().min(1), type: z.literal("outro"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object({ title: z.string(), cta: z.string() }) }),
]);

const legacySceneWithTransitionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hook"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object(hookSceneFields) }),
  z.object({ id: z.string().min(1), type: z.literal("visualization"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object({ annotationsEnabled: z.boolean() }) }),
  z.object({ id: z.string().min(1), type: z.literal("final-ranking"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object(finalRankingFields) }),
  z.object({ id: z.string().min(1), type: z.literal("outro"), enabled: z.boolean(), durationFrames: z.number().int().positive(), entryTransition: sceneTransitionSchema, config: z.object({ title: z.string(), cta: z.string() }) }),
]);

const legacySceneWithoutTransitionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hook"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object(hookSceneFields) }),
  z.object({ id: z.string().min(1), type: z.literal("visualization"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object({ annotationsEnabled: z.boolean() }) }),
  z.object({ id: z.string().min(1), type: z.literal("final-ranking"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object(finalRankingFields) }),
  z.object({ id: z.string().min(1), type: z.literal("outro"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object({ title: z.string(), cta: z.string() }) }),
]);

const storyEventTypeSchema = z.enum([
  "lead-change", "major-rise", "major-fall", "top-entry", "top-exit", "record-value", "milestone", "fastest-growth",
  "largest-decline", "comeback", "sustained-dominance", "rapid-rise", "collapse", "close-rivalry", "overtaking-streak", "sudden-breakout",
]);

const legacyStoryEventTypeSchema = z.enum(["lead-change", "major-rise", "major-fall", "top-entry", "top-exit", "record-value", "milestone", "fastest-growth"]);

const legacyEventSettingsSchema = z.object({
  enabled: z.boolean(),
  enabledTypes: z.array(legacyStoryEventTypeSchema),
  frequency: z.enum(["low", "medium", "high"]),
  minimumImportance: z.number().min(0).max(100),
  durationFrames: z.number().int().positive(),
  topN: z.number().int().min(1).max(20),
  majorRankChange: z.number().int().min(1).max(20),
  milestones: z.array(z.number().finite()),
});

const sourceMetadataSchema = z.object({
  name: z.string(),
  url: z.union([z.literal(""), z.string().url()]),
  publisher: z.string(),
  retrievedDate: z.string(),
  notes: z.string(),
  licenseNotes: z.string(),
});

const storyAssistantSchema = z.object({
  analysisVersion: z.literal(1),
  generationSeed: z.number().int().min(0),
  selectedCandidateId: z.string().nullable(),
  selectedHookId: z.string().nullable(),
  selectedTitleId: z.string().nullable(),
  presetId: z.enum(["fast-race", "story-short", "dramatic-rise-fall", "data-documentary", "ranking-history", "rise-and-fall", "head-to-head", "decade-by-decade"]),
  adaptivePacing: z.object({ enabled: z.boolean(), intensity: z.enum(["low", "medium", "high"]) }),
});

export const exportConfigSchema = z.object({
  presetId: z.enum(["youtube-shorts", "instagram-reels", "facebook-reels", "tiktok", "youtube-1080p", "youtube-1440p", "youtube-4k", "facebook-landscape", "square", "portrait-feed", "custom"]),
  width: z.number().int().min(320).max(7680),
  height: z.number().int().min(320).max(7680),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  quality: z.enum(["draft", "standard", "high", "maximum"]),
  codec: z.literal("h264"),
  filename: z.string().min(1).max(160),
});

const audioSchema = z.object({
  enabled: z.boolean(),
  assetId: z.string().regex(/^[a-zA-Z0-9-]+$/).nullable(),
  fileName: z.string().max(255).nullable(),
  mimeType: z.enum(["audio/mpeg", "audio/wav"]).nullable(),
  durationSeconds: z.number().positive().nullable(),
  startOffsetSeconds: z.number().min(0).max(86400),
  trimStartSeconds: z.number().min(0).max(86400),
  trimEndSeconds: z.number().positive().max(86400).nullable(),
  volume: z.number().min(0).max(1),
  fadeInSeconds: z.number().min(0).max(30),
  fadeOutSeconds: z.number().min(0).max(30),
  loop: z.boolean(),
});

const projectBaseFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  visualizationType: z.literal("bar-chart-race"),
  dataset: z.object({ name: z.string(), mapping: mappingSchema, rows: z.array(rawRowSchema) }),
  content: z.object({ title: z.string(), subtitle: z.string(), source: z.string(), footer: z.string() }),
  visualization: visualizationSchema,
  themeId: z.string(),
  video: videoSchema,
  export: exportConfigSchema,
  audio: audioSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const projectConfigSchema = z.object({
  schemaVersion: z.literal(4),
  ...projectBaseFields,
  sourceMetadata: sourceMetadataSchema,
  publishing: z.object({ youtubeDescription: z.string(), shortCaption: z.string(), socialCaption: z.string(), sourceAttribution: z.string(), finalTakeaway: z.string() }),
  story: storyAssistantSchema,
  timeline: z.object({ scenes: z.array(storySceneSchema).min(1) }),
  events: z.object({
    enabled: z.boolean(),
    enabledTypes: z.array(storyEventTypeSchema),
    frequency: z.enum(["low", "medium", "high"]),
    minimumImportance: z.number().min(0).max(100),
    maximumAnnotations: z.number().int().min(0).max(50),
    durationFrames: z.number().int().positive(),
    topN: z.number().int().min(1).max(20),
    majorRankChange: z.number().int().min(1).max(20),
    milestones: z.array(z.number().finite()),
  }),
});

const versionThreeSchema = z.object({
  schemaVersion: z.literal(3),
  ...projectBaseFields,
  timeline: z.object({ scenes: z.array(legacySceneWithTransitionSchema).min(1) }),
  events: legacyEventSettingsSchema,
});

const versionTwoSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().min(1),
  name: z.string().min(1),
  visualizationType: z.literal("bar-chart-race"),
  dataset: z.object({ name: z.string(), mapping: mappingSchema, rows: z.array(rawRowSchema) }),
  content: z.object({ title: z.string(), subtitle: z.string(), source: z.string(), footer: z.string() }),
  visualization: visualizationSchema,
  themeId: z.string(),
  video: videoSchema,
  timeline: z.object({ scenes: z.array(legacySceneWithoutTransitionSchema).min(1) }),
  events: legacyEventSettingsSchema,
  export: z.object({ quality: z.enum(["draft", "standard", "high"]), filename: z.string().min(1) }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const versionOneSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  visualizationType: z.literal("bar-chart-race"),
  dataset: z.object({ name: z.string(), mapping: mappingSchema }),
  content: z.object({ title: z.string(), subtitle: z.string(), source: z.string(), footer: z.string() }),
  visualization: visualizationSchema.omit({ imageStyle: true }),
  themeId: z.string(),
  video: videoSchema.omit({ mode: true }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

function sourceMetadataFromText(source: string): SourceMetadata {
  return { name: source, url: "", publisher: "", retrievedDate: "", notes: "", licenseNotes: "" };
}

function phaseFourDefaults(source: string) {
  const defaults = createDefaultProject();
  return {
    sourceMetadata: sourceMetadataFromText(source),
    publishing: { ...defaults.publishing, sourceAttribution: source ? `Source: ${source}` : "" },
    story: { ...defaultStoryAssistantConfig, adaptivePacing: { ...defaultStoryAssistantConfig.adaptivePacing } },
  };
}

export function parseProjectConfig(input: unknown): ProjectConfig {
  const current = projectConfigSchema.safeParse(input);
  if (current.success) return current.data;

  const versionThree = versionThreeSchema.safeParse(input);
  if (versionThree.success) {
    return projectConfigSchema.parse({
      ...versionThree.data,
      ...phaseFourDefaults(versionThree.data.content.source),
      schemaVersion: 4,
      timeline: { scenes: versionThree.data.timeline.scenes.map((scene) => scene.type === "visualization" ? { ...scene, config: { ...scene.config, periodStartIndex: null, periodEndIndex: null } } : scene) },
      events: { ...defaultEventSettings, ...versionThree.data.events, maximumAnnotations: defaultEventSettings.maximumAnnotations },
    });
  }

  const versionTwo = versionTwoSchema.safeParse(input);
  if (versionTwo.success) {
    const defaults = createDefaultProject();
    return projectConfigSchema.parse({
      ...versionTwo.data,
      ...phaseFourDefaults(versionTwo.data.content.source),
      schemaVersion: 4,
      timeline: {
        scenes: versionTwo.data.timeline.scenes.map((scene) => ({
          ...scene,
          entryTransition: defaults.timeline.scenes.find((candidate) => candidate.type === scene.type)?.entryTransition ?? { type: "cut", durationFrames: 0 },
          config: scene.type === "visualization" ? { ...scene.config, periodStartIndex: null, periodEndIndex: null } : scene.config,
        })),
      },
      events: { ...defaultEventSettings, ...versionTwo.data.events, maximumAnnotations: defaultEventSettings.maximumAnnotations },
      export: { ...defaults.export, quality: versionTwo.data.export.quality, filename: versionTwo.data.export.filename },
      audio: { ...defaultAudioConfig },
    });
  }

  const legacy = versionOneSchema.safeParse(input);
  if (!legacy.success) throw new Error("Project file is invalid or uses an unsupported schema version.");

  const defaults = createDefaultProject();
  return projectConfigSchema.parse({
    ...legacy.data,
    ...phaseFourDefaults(legacy.data.content.source),
    schemaVersion: 4,
    dataset: { ...legacy.data.dataset, rows: [] },
    visualization: { ...legacy.data.visualization, imageStyle: "circle" },
    video: { ...legacy.data.video, mode: "custom" },
    timeline: defaults.timeline,
    events: { ...defaultEventSettings },
    export: defaults.export,
    audio: { ...defaultAudioConfig },
  });
}

export function serializeProject(project: ProjectConfig): string {
  return JSON.stringify(projectConfigSchema.parse(project));
}
