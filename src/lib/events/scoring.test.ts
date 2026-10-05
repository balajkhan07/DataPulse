import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";
import { detectStoryEvents } from "@/lib/events/detect-events";
import { deduplicateStoryEvents, scoreStoryEvent } from "@/lib/events/scoring";
import type { StoryEvent } from "@/types/story";

function event(id: string, periodIndex: number, importance: number): StoryEvent {
  return { id, type: "major-rise", time: periodIndex, timeLabel: String(periodIndex), periodIndex, entityIds: ["alpha"], importance, confidence: 0.9, metrics: { change: 3 }, reason: "Fixture" };
}

describe("event scoring and clustering", () => {
  it("scores leader and top-three events above equivalent ordinary movement", () => {
    const ordinary = scoreStoryEvent("major-rise", { rankMagnitude: 3 });
    const leader = scoreStoryEvent("major-rise", { rankMagnitude: 3, affectsLeader: true, affectsTopThree: true });
    expect(leader).toBeGreaterThan(ordinary);
    expect(leader).toBeLessThanOrEqual(100);
  });

  it("keeps the strongest nearby duplicate event", () => {
    expect(deduplicateStoryEvents([event("a", 2, 60), event("b", 3, 88), event("c", 7, 70)]).map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("detects dominance and close rivalry from measured rankings", () => {
    const dataset = normalizeDataset([
      { year: 2020, entity: "Alpha", value: 100 }, { year: 2020, entity: "Beta", value: 80 },
      { year: 2021, entity: "Alpha", value: 110 }, { year: 2021, entity: "Beta", value: 100 },
      { year: 2022, entity: "Alpha", value: 120 }, { year: 2022, entity: "Beta", value: 116 },
      { year: 2023, entity: "Alpha", value: 125 }, { year: 2023, entity: "Beta", value: 124 },
    ], { time: "year", category: "entity", value: "value" }).dataset;
    if (!dataset) throw new Error("Fixture normalization failed");
    const events = detectStoryEvents(dataset);
    expect(events.some((item) => item.type === "sustained-dominance" && item.metrics.periods === 4)).toBe(true);
    expect(events.some((item) => item.type === "close-rivalry")).toBe(true);
    expect(events.every((item) => item.importance >= 0 && item.importance <= 100)).toBe(true);
  });

  it("detects comeback, breakout, collapse, rapid rise, decline, and overtaking arcs", () => {
    const dataset = normalizeDataset([
      { year: 2020, entity: "Alpha", value: 100 }, { year: 2020, entity: "Beta", value: 90 }, { year: 2020, entity: "Charlie", value: 80 }, { year: 2020, entity: "Delta", value: 70 }, { year: 2020, entity: "Echo", value: 60 },
      { year: 2021, entity: "Alpha", value: 110 }, { year: 2021, entity: "Beta", value: 100 }, { year: 2021, entity: "Delta", value: 95 }, { year: 2021, entity: "Echo", value: 80 }, { year: 2021, entity: "Charlie", value: 10 },
      { year: 2022, entity: "Alpha", value: 120 }, { year: 2022, entity: "Delta", value: 110 }, { year: 2022, entity: "Echo", value: 105 }, { year: 2022, entity: "Beta", value: 90 }, { year: 2022, entity: "Charlie", value: 20 },
      { year: 2023, entity: "Alpha", value: 125 }, { year: 2023, entity: "Charlie", value: 123 }, { year: 2023, entity: "Delta", value: 115 }, { year: 2023, entity: "Echo", value: 110 }, { year: 2023, entity: "Beta", value: 80 },
    ], { time: "year", category: "entity", value: "value" }).dataset;
    if (!dataset) throw new Error("Fixture normalization failed");
    const types = new Set(detectStoryEvents(dataset, { topN: 3, majorRankChange: 1 }).map((item) => item.type));
    expect(types).toEqual(expect.objectContaining(new Set(["comeback", "sudden-breakout", "collapse", "rapid-rise", "largest-decline", "overtaking-streak"])));
  });
});
