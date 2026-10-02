import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/lib/project/defaults";
import { parseProjectConfig, projectConfigSchema, serializeProject } from "@/lib/project/schema";

function omitKey<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const { [key]: omitted, ...rest } = value;
  void omitted;
  return rest;
}

describe("project config schema", () => {
  it("round-trips a serializable version 3 project", () => {
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
    expect(migrated.schemaVersion).toBe(3);
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
      audio: undefined,
    };
    const migrated = parseProjectConfig(legacy);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.export.quality).toBe("standard");
    expect(migrated.export.filename).toBe("legacy.mp4");
    expect(migrated.timeline.scenes[1].entryTransition.type).toBe("crossfade");
    expect(migrated.audio).toEqual(expect.objectContaining({ enabled: false, assetId: null }));
  });

  it("rejects unsupported schema versions", () => {
    expect(() => parseProjectConfig({ ...createDefaultProject(), schemaVersion: 99 })).toThrow(/unsupported schema/i);
  });
});
