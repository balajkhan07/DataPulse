import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/lib/project/defaults";
import { applyProjectTemplate } from "@/lib/templates/apply-template";
import { projectTemplates } from "@/templates";

describe("applyProjectTemplate", () => {
  it("applies visual and behavioral settings without replacing content or data", () => {
    const project = createDefaultProject();
    project.dataset.rows = [{ year: 2020, company: "Acme", value: 4 }];
    project.content.title = "Keep this title";
    const template = projectTemplates.find((candidate) => candidate.id === "documentary");
    if (!template) throw new Error("Template fixture missing");
    const result = applyProjectTemplate(project, template);

    expect(result.themeId).toBe("documentary");
    expect(result.video.mode).toBe("long-form");
    expect(result.video.aspectRatio).toBe("landscape");
    expect(result.content.title).toBe("Keep this title");
    expect(result.dataset).toEqual(project.dataset);
  });

  it("preserves annotation time when a template changes frame rate", () => {
    const project = createDefaultProject();
    const template = projectTemplates.find((candidate) => candidate.id === "tech-signal");
    if (!template) throw new Error("Template fixture missing");
    const result = applyProjectTemplate(project, template);

    expect(result.video.fps).toBe(60);
    expect(result.events.durationFrames).toBe(project.events.durationFrames * 2);
  });
});
