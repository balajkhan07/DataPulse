import { describe, expect, it } from "vitest";
import { getExportMetrics, prepareProjectForExport, sanitizeExportFilename } from "@/lib/export/config";
import { createDefaultProject } from "@/lib/project/defaults";

describe("export configuration", () => {
  it("sanitizes filenames without allowing path traversal", () => {
    expect(sanitizeExportFilename(" ../../My Story🔥.MP4 ")).toBe("my-story.mp4");
    expect(sanitizeExportFilename("...")).toBe("datapulse-story.mp4");
  });

  it("preserves story duration while retiming frames for a new frame rate", () => {
    const project = createDefaultProject();
    project.timeline.scenes = project.timeline.scenes.map((scene) => ({ ...scene, durationFrames: 150 }));
    const before = getExportMetrics(project, project.export).durationSeconds;
    const config = { ...project.export, fps: 60 as const, width: 1920, height: 1080, presetId: "youtube-1080p" as const };
    const prepared = prepareProjectForExport(project, config);
    expect(getExportMetrics(project, config).durationSeconds).toBe(before);
    expect(prepared.timeline.scenes.every((scene) => scene.durationFrames === 300)).toBe(true);
    expect(prepared.video).toEqual(expect.objectContaining({ width: 1920, height: 1080, fps: 60, aspectRatio: "landscape" }));
  });

  it("uses preset safe areas when dimensions match the selected preset", () => {
    const project = createDefaultProject();
    const config = { ...project.export, presetId: "youtube-1080p" as const, width: 1920, height: 1080 };
    expect(prepareProjectForExport(project, config).video.safeArea).toEqual({ top: 72, right: 120, bottom: 84, left: 120 });
  });
});
