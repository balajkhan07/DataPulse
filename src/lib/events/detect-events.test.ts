import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";
import { detectStoryEvents } from "@/lib/events/detect-events";
import { presentStoryEvent } from "@/lib/events/presentation";
import { defaultBarChartRaceConfig } from "@/lib/project/defaults";

const dataset = normalizeDataset(
  [
    { year: "2020", entity: "Alpha", value: "100" },
    { year: "2020", entity: "Beta", value: "80" },
    { year: "2020", entity: "Gamma", value: "60" },
    { year: "2020", entity: "Delta", value: "40" },
    { year: "2021", entity: "Beta", value: "160" },
    { year: "2021", entity: "Delta", value: "110" },
    { year: "2021", entity: "Alpha", value: "90" },
    { year: "2021", entity: "Epsilon", value: "70" },
  ],
  { time: "year", category: "entity", value: "value" },
).dataset;

describe("detectStoryEvents", () => {
  it("detects leader changes and keeps presentation separate", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const leadChange = detectStoryEvents(dataset, { topN: 3 }).find((item) => item.type === "lead-change");
    expect(leadChange).toMatchObject({ entityIds: ["beta", "alpha"], importance: 100, periodIndex: 1 });
    expect(leadChange && presentStoryEvent(leadChange, dataset, defaultBarChartRaceConfig).title).toBe("Beta takes the lead");
  });

  it("detects top-N entry and exit", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const events = detectStoryEvents(dataset, { topN: 3 });
    expect(events.some((item) => item.type === "top-entry" && item.entityIds[0] === "delta")).toBe(true);
    expect(events.some((item) => item.type === "top-exit" && item.entityIds[0] === "gamma")).toBe(true);
  });

  it("detects major movement, records, and configured milestones", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const events = detectStoryEvents(dataset, { topN: 4, majorRankChange: 2, milestones: [150] });
    expect(events.some((item) => item.type === "major-rise" && item.entityIds[0] === "delta")).toBe(true);
    expect(events.some((item) => item.type === "major-fall" && item.entityIds[0] === "alpha")).toBe(true);
    expect(events.some((item) => item.type === "record-value" && item.entityIds[0] === "beta")).toBe(true);
    expect(events.some((item) => item.type === "milestone" && item.data.milestone === 150)).toBe(true);
  });

  it("returns importance scores in the 0–100 range", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    expect(detectStoryEvents(dataset).every((item) => item.importance >= 0 && item.importance <= 100)).toBe(true);
  });
});
