import { z } from "zod";

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

export const projectConfigSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  visualizationType: z.literal("bar-chart-race"),
  dataset: z.object({ name: z.string(), mapping: mappingSchema }),
  content: z.object({
    title: z.string(),
    subtitle: z.string(),
    source: z.string(),
    footer: z.string(),
  }),
  visualization: z.object({
    topN: z.number().int().min(3).max(20),
    showRank: z.boolean(),
    showValues: z.boolean(),
    showImages: z.boolean(),
    barRadius: z.number().min(0).max(40),
    barOpacity: z.number().min(0.2).max(1),
    valueFormat: z.enum(["raw", "integer", "compact", "currency", "percentage"]),
    valuePrefix: z.string(),
    valueSuffix: z.string(),
    currency: z.string().length(3),
    missingValueStrategy: z.enum(["zero", "carry"]),
    secondsPerPeriod: z.number().min(0.2).max(10),
    easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]),
  }),
  themeId: z.string(),
  video: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
    aspectRatio: z.enum(["portrait", "landscape", "square", "feed"]),
    safeArea: z.object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() }),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
