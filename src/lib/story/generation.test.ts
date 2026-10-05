import { describe, expect, it } from "vitest";
import { analyzeProject } from "@/lib/analysis/project-analysis";
import { createDefaultProject } from "@/lib/project/defaults";
import { generateStoryDraft } from "@/lib/story/drafts";
import { generateDescriptions, generateHooks, generateStoryCandidates, generateTitles } from "@/lib/story/generation";
import { evaluateContentQuality } from "@/lib/story/quality";
import { generateBatchStoryDrafts } from "@/lib/story/project-story";

function fixtureProject() {
  const project = createDefaultProject();
  project.dataset = {
    name: "Market Leaders",
    mapping: { time: "year", category: "entity", value: "value" },
    rows: [
      { year: 2020, entity: "Alpha", value: 100 }, { year: 2020, entity: "Beta", value: 70 }, { year: 2020, entity: "Gamma", value: 30 },
      { year: 2021, entity: "Alpha", value: 110 }, { year: 2021, entity: "Beta", value: 95 }, { year: 2021, entity: "Gamma", value: 50 },
      { year: 2022, entity: "Beta", value: 125 }, { year: 2022, entity: "Alpha", value: 115 }, { year: 2022, entity: "Gamma", value: 90 },
      { year: 2023, entity: "Gamma", value: 160 }, { year: 2023, entity: "Beta", value: 130 }, { year: 2023, entity: "Alpha", value: 105 },
      { year: 2024, entity: "Gamma", value: 190 }, { year: 2024, entity: "Beta", value: 135 }, { year: 2024, entity: "Alpha", value: 90 },
    ],
  };
  project.sourceMetadata = { name: "Annual rankings", publisher: "Example Institute", url: "https://example.com/data", retrievedDate: "2026-10-04", notes: "", licenseNotes: "CC BY" };
  project.content.title = "Market Leaders Through Time";
  return project;
}

describe("rule-based story generation", () => {
  it("generates grounded angles, hooks, titles, and descriptions without an AI key", () => {
    const project = fixtureProject();
    const analysis = analyzeProject(project);
    const input = { project, analysis, seed: 0 };
    expect(generateStoryCandidates(input).length).toBeGreaterThanOrEqual(3);
    expect(generateHooks(input).length).toBeGreaterThanOrEqual(5);
    expect(new Set(generateTitles(input).map((title) => title.style))).toEqual(expect.objectContaining(new Set(["neutral", "story"])));
    const descriptions = generateDescriptions(input);
    expect(descriptions.youtubeDescription).toContain("Example Institute");
    expect(descriptions.sourceAttribution).toContain("https://example.com/data");
  });

  it("creates editable short and chaptered long-form timelines", () => {
    const project = fixtureProject();
    const analysis = analyzeProject(project);
    const input = { project, analysis, seed: 2 };
    const shortDraft = generateStoryDraft(input, { presetId: "story-short", seed: 2 });
    const longDraft = generateStoryDraft(input, { presetId: "data-documentary", seed: 2 });
    expect(shortDraft.videoMode).toBe("short-form");
    expect(shortDraft.timeline.scenes.some((scene) => scene.type === "text" && scene.config.kind === "takeaway")).toBe(true);
    expect(longDraft.videoMode).toBe("long-form");
    expect(longDraft.timeline.scenes.filter((scene) => scene.type === "visualization").length).toBeGreaterThan(1);
    expect(longDraft.timeline.scenes.filter((scene) => scene.type === "visualization").every((scene) => scene.type === "visualization" && scene.config.periodStartIndex !== null)).toBe(true);
    expect(longDraft.timeline.scenes.length).toBeGreaterThan(shortDraft.timeline.scenes.length);
  });

  it("reports practical quality gaps without blocking export", () => {
    const project = fixtureProject();
    project.timeline.scenes = [project.timeline.scenes.find((scene) => scene.type === "visualization")!];
    const report = evaluateContentQuality(project);
    expect(report.score).toBeLessThan(75);
    expect(report.warnings).toContain("This draft contains only one continuous visualization scene.");
  });

  it("supports editor-independent batch draft generation", () => {
    const projects = [fixtureProject(), { ...fixtureProject(), id: "second-project", name: "Second project" }];
    const results = generateBatchStoryDrafts(projects, { presetId: "fast-race", seed: 1 });
    expect(results).toHaveLength(2);
    expect(results.map((result) => result.sourceProjectId)).toEqual([projects[0].id, "second-project"]);
    expect(results.every((result) => result.draft.timeline.scenes.length >= 4)).toBe(true);
  });
});
