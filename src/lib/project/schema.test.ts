import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/lib/project/defaults";
import { parseProjectConfig, projectConfigSchema, serializeProject } from "@/lib/project/schema";

function omitKey<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const { [key]: omitted, ...rest } = value;
  void omitted;
  return rest;
}

describe("project config schema", () => {
  const legacyEventTypes = new Set(["lead-change", "major-rise", "major-fall", "top-entry", "top-exit", "record-value", "milestone", "fastest-growth"]);
  it("round-trips a serializable version 4 project with source and story metadata", () => {
    const project = createDefaultProject();
    expect(projectConfigSchema.safeParse(project).success).toBe(true);
    expect(parseProjectConfig(JSON.parse(serializeProject(project)))).toEqual(project);
  });

  it("migrates the Phase 1 schema", () => {
    const current = createDefaultProject();
    const dataset = omitKey(current.dataset, "rows");
    const visualization = omitKey(current.visualization, "imageStyle");
    const video = omitKey(current.video, "mode");
    const legacy = {
      schemaVersion: 1,
      id: current.id,
      name: current.name,
      visualizationType: current.visualizationType,
      dataset,
      content: current.content,
      visualization,
      themeId: current.themeId,
      video,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
    };
    const migrated = parseProjectConfig(legacy);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.timeline.scenes.map((scene) => scene.type)).toEqual(["hook", "visualization", "final-ranking", "outro"]);
    expect(migrated.audio.enabled).toBe(false);
  });

  it("migrates a Phase 2 project with export defaults and scene transitions", () => {
    const current = createDefaultProject();
    const legacy = {
      ...current,
      schemaVersion: 2,
      timeline: {
        scenes: current.timeline.scenes.map(({ entryTransition: omitted, ...scene }) => {
          void omitted;
          return scene;
        }),
      },
      export: { quality: "standard", filename: "legacy.mp4" },
      events: {
        ...omitKey(current.events, "maximumAnnotations"),
        enabledTypes: current.events.enabledTypes.filter((type) => legacyEventTypes.has(type)),
      },
      audio: undefined,
    };
    const migrated = parseProjectConfig(legacy);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.export.quality).toBe("standard");
    expect(migrated.export.filename).toBe("legacy.mp4");
    expect(migrated.timeline.scenes[1].entryTransition.type).toBe("crossfade");
    expect(migrated.audio).toEqual(expect.objectContaining({ enabled: false, assetId: null }));
    expect(migrated.story.analysisVersion).toBe(1);
    expect(migrated.sourceMetadata.name).toBe(current.content.source);
  });

  it("migrates a Phase 3 project with analysis, source, pacing, and scene-range defaults", () => {
    const current = createDefaultProject();
    const legacy = {
      ...current,
      schemaVersion: 3,
      sourceMetadata: undefined,
      publishing: undefined,
      story: undefined,
      events: {
        ...omitKey(current.events, "maximumAnnotations"),
        enabledTypes: current.events.enabledTypes.filter((type) => legacyEventTypes.has(type)),
      },
      timeline: {
        scenes: current.timeline.scenes.map((scene) => scene.type === "visualization"
          ? { ...scene, config: omitKey(scene.config, "periodStartIndex") }
          : scene).map((scene) => scene.type === "visualization"
            ? { ...scene, config: omitKey(scene.config, "periodEndIndex") }
            : scene),
      },
    };
    const migrated = parseProjectConfig(legacy);
    const visualization = migrated.timeline.scenes.find((scene) => scene.type === "visualization");
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.events.maximumAnnotations).toBeGreaterThan(0);
    expect(visualization?.type === "visualization" && visualization.config.periodStartIndex).toBeNull();
    expect(migrated.publishing.sourceAttribution).toContain(current.content.source);
  });

  it("rejects unsupported schema versions", () => {
    expect(() => parseProjectConfig({ ...createDefaultProject(), schemaVersion: 99 })).toThrow(/unsupported schema/i);
  });
});
