import { describe, expect, it } from "vitest";
import { analyzeNormalizedDataset } from "@/lib/analysis/dataset-analysis";
import { analyzeProject, clearProjectAnalysisCache, createProjectAnalysisCacheKey } from "@/lib/analysis/project-analysis";
import { normalizeDataset } from "@/lib/data/normalization";
import { createDefaultProject } from "@/lib/project/defaults";

const rows = [
  { year: 2020, entity: "Alpha", value: 100 }, { year: 2020, entity: "Beta", value: 80 }, { year: 2020, entity: "Gamma", value: 40 },
  { year: 2021, entity: "Alpha", value: 120 }, { year: 2021, entity: "Beta", value: 95 }, { year: 2021, entity: "Gamma", value: 48 },
  { year: 2022, entity: "Alpha", value: 130 }, { year: 2022, entity: "Beta", value: 126 }, { year: 2022, entity: "Gamma", value: 55 },
  { year: 2023, entity: "Beta", value: 155 }, { year: 2023, entity: "Alpha", value: 125 }, { year: 2023, entity: "Gamma", value: 92 },
  { year: 2024, entity: "Beta", value: 165 }, { year: 2024, entity: "Gamma", value: 150 }, { year: 2024, entity: "Alpha", value: 105 },
  { year: 2025, entity: "Gamma", value: 220 }, { year: 2025, entity: "Beta", value: 160 }, { year: 2025, entity: "Alpha", value: 72 },
];

describe("dataset analysis", () => {
  it("summarizes leaders, entity arcs, volatility, and interesting periods", () => {
    const dataset = normalizeDataset(rows, { time: "year", category: "entity", value: "value" }).dataset;
    if (!dataset) throw new Error("Fixture normalization failed");
    const analysis = analyzeNormalizedDataset(dataset, { topN: 3, majorRankChange: 1 });

    expect(analysis.summary).toMatchObject({ firstTimeLabel: "2020", lastTimeLabel: "2025", entityCount: 3, periodCount: 6, latestLeaderId: "gamma" });
    expect(analysis.summary.longestLeaderEntityId).toBe("alpha");
    expect(analysis.summary.longestLeaderPeriods).toBe(3);
    expect(analysis.events.some((event) => event.type === "lead-change" && event.timeLabel === "2023")).toBe(true);
    expect(analysis.interestingPeriods.some((period) => period.timeLabel === "2023" && period.reasons.includes("Leadership changed"))).toBe(true);
    expect(analysis.entityStats.find((entity) => entity.entityId === "gamma")?.lastRank).toBe(1);
  });

  it("caches by dataset, mapping, event options, and analysis version only", () => {
    clearProjectAnalysisCache();
    const project = createDefaultProject();
    project.dataset = { name: "Fixture", rows, mapping: { time: "year", category: "entity", value: "value" } };
    const first = analyzeProject(project);
    const themed = { ...project, themeId: "clean-light", content: { ...project.content, title: "A different title" } };
    expect(createProjectAnalysisCacheKey(themed)).toBe(createProjectAnalysisCacheKey(project));
    expect(analyzeProject(themed)).toBe(first);

    const changed = { ...project, dataset: { ...project.dataset, rows: [...rows, { year: 2026, entity: "Gamma", value: 240 }] } };
    expect(createProjectAnalysisCacheKey(changed)).not.toBe(createProjectAnalysisCacheKey(project));
    expect(analyzeProject(changed)).not.toBe(first);
  });
});
