import { describe, expect, it } from "vitest";
import { createAnnotationSchedule, getActiveAnnotation } from "@/lib/events/annotations";
import { normalizeDataset } from "@/lib/data/normalization";
import { defaultBarChartRaceConfig, defaultEventSettings } from "@/lib/project/defaults";
import type { StoryEvent } from "@/types/story";

const dataset = normalizeDataset(
  [
    { year: "2020", entity: "Alpha", value: "100" },
    { year: "2020", entity: "Beta", value: "80" },
    { year: "2021", entity: "Beta", value: "160" },
    { year: "2021", entity: "Alpha", value: "90" },
  ],
  { time: "year", category: "entity", value: "value" },
).dataset;

function storyEvent(id: string, importance: number, periodIndex: number): StoryEvent {
  return {
    id,
    type: "lead-change",
    time: 2021,
    timeLabel: "2021",
    periodIndex,
    entityIds: ["beta", "alpha"],
    importance,
    confidence: 1,
    metrics: { newLeader: "beta", previousLeader: "alpha" },
    reason: "The leader changed.",
  };
}

describe("annotation scheduling", () => {
  it("filters by importance and resolves nearby events to the strongest event", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const schedule = createAnnotationSchedule(
      [storyEvent("low", 40, 0), storyEvent("medium", 72, 1), storyEvent("high", 95, 1)],
      dataset,
      300,
      30,
      { ...defaultEventSettings, frequency: "low", minimumImportance: 60, durationFrames: 45 },
      defaultBarChartRaceConfig,
    );

    expect(schedule).toHaveLength(1);
    expect(schedule[0]).toMatchObject({ eventId: "high", importance: 95, durationFrames: 45 });
    expect(getActiveAnnotation(schedule, schedule[0].startFrame)?.eventId).toBe("high");
    expect(getActiveAnnotation(schedule, schedule[0].startFrame + 45)).toBeNull();
  });
});
