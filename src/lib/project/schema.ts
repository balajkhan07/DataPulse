import { z } from "zod";
import { createDefaultProject, defaultAudioConfig, defaultEventSettings } from "@/lib/project/defaults";
import type { ProjectConfig } from "@/types/project";

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

const storySceneSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("hook"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({
      title: z.string(),
      subtitle: z.string(),
      hookText: z.string(),
      background: z.enum(["spotlight", "gradient", "solid"]).default("spotlight"),
      transition: z.enum(["fade", "rise"]),
    }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("visualization"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({ annotationsEnabled: z.boolean() }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("final-ranking"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({ title: z.string(), topN: z.number().int().min(1).max(20), showValues: z.boolean(), showImages: z.boolean() }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("outro"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    entryTransition: sceneTransitionSchema,
    config: z.object({ title: z.string(), cta: z.string() }),
  }),
]);

const storyEventTypeSchema = z.enum([
  "lead-change",
  "major-rise",
  "major-fall",
  "top-entry",
  "top-exit",
  "record-value",
  "milestone",
  "fastest-growth",
]);

export const exportConfigSchema = z.object({
  presetId: z.enum(["youtube-shorts", "instagram-reels", "facebook-reels", "tiktok", "youtube-1080p", "youtube-1440p", "youtube-4k", "facebook-landscape", "square", "portrait-feed", "custom"]),
  width: z.number().int().min(320).max(7680),
  height: z.number().int().min(320).max(7680),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  quality: z.enum(["draft", "standard", "high", "maximum"]),
  codec: z.literal("h264"),
  filename: z.string().min(1).max(160),
});

export const projectConfigSchema = z.object({
  schemaVersion: z.literal(3),
  id: z.string().min(1),
  name: z.string().min(1),
  visualizationType: z.literal("bar-chart-race"),
  dataset: z.object({ name: z.string(), mapping: mappingSchema, rows: z.array(rawRowSchema) }),
  content: z.object({ title: z.string(), subtitle: z.string(), source: z.string(), footer: z.string() }),
  visualization: visualizationSchema,
  themeId: z.string(),
  video: videoSchema,
  timeline: z.object({ scenes: z.array(storySceneSchema).min(1) }),
  events: z.object({
    enabled: z.boolean(),
    enabledTypes: z.array(storyEventTypeSchema),
    frequency: z.enum(["low", "medium", "high"]),
    minimumImportance: z.number().min(0).max(100),
    durationFrames: z.number().int().positive(),
    topN: z.number().int().min(1).max(20),
    majorRankChange: z.number().int().min(1).max(20),
    milestones: z.array(z.number().finite()),
  }),
  export: exportConfigSchema,
  audio: z.object({
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
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const versionTwoStorySceneSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("hook"),
    enabled: z.boolean(),
    durationFrames: z.number().int().positive(),
    config: z.object({
      title: z.string(),
      subtitle: z.string(),
      hookText: z.string(),
      background: z.enum(["spotlight", "gradient", "solid"]).default("spotlight"),
      transition: z.enum(["fade", "rise"]),
    }),
  }),
  z.object({ id: z.string().min(1), type: z.literal("visualization"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object({ annotationsEnabled: z.boolean() }) }),
  z.object({ id: z.string().min(1), type: z.literal("final-ranking"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object({ title: z.string(), topN: z.number().int().min(1).max(20), showValues: z.boolean(), showImages: z.boolean() }) }),
  z.object({ id: z.string().min(1), type: z.literal("outro"), enabled: z.boolean(), durationFrames: z.number().int().positive(), config: z.object({ title: z.string(), cta: z.string() }) }),
]);

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
  timeline: z.object({ scenes: z.array(versionTwoStorySceneSchema).min(1) }),
  events: z.object({
    enabled: z.boolean(),
    enabledTypes: z.array(storyEventTypeSchema),
    frequency: z.enum(["low", "medium", "high"]),
    minimumImportance: z.number().min(0).max(100),
    durationFrames: z.number().int().positive(),
    topN: z.number().int().min(1).max(20),
    majorRankChange: z.number().int().min(1).max(20),
    milestones: z.array(z.number().finite()),
  }),
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

export function parseProjectConfig(input: unknown): ProjectConfig {
  const current = projectConfigSchema.safeParse(input);
  if (current.success) return current.data;

  const versionTwo = versionTwoSchema.safeParse(input);
  if (versionTwo.success) {
    const defaults = createDefaultProject();
    return projectConfigSchema.parse({
      ...versionTwo.data,
      schemaVersion: 3,
      timeline: {
        scenes: versionTwo.data.timeline.scenes.map((scene) => ({
          ...scene,
          entryTransition: defaults.timeline.scenes.find((candidate) => candidate.type === scene.type)?.entryTransition ?? { type: "cut", durationFrames: 0 },
        })),
      },
      export: { ...defaults.export, quality: versionTwo.data.export.quality, filename: versionTwo.data.export.filename },
      audio: { ...defaultAudioConfig },
    });
  }

  const legacy = versionOneSchema.safeParse(input);
  if (!legacy.success) throw new Error("Project file is invalid or uses an unsupported schema version.");

  const defaults = createDefaultProject();
  return projectConfigSchema.parse({
    ...legacy.data,
    schemaVersion: 3,
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
