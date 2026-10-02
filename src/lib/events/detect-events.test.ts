import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";
import { detectStoryEvents } from "@/lib/events/detect-events";

describe("detectStoryEvents", () => {
  it("detects a leadership change", () => {
    const dataset = normalizeDataset(
      [
        { year: "2020", entity: "Alpha", value: "10" },
        { year: "2020", entity: "Beta", value: "5" },
        { year: "2021", entity: "Alpha", value: "12" },
        { year: "2021", entity: "Beta", value: "20" },
      ],
      { time: "year", category: "entity", value: "value" },
    ).dataset;

    if (!dataset) throw new Error("Fixture normalization failed");
    expect(detectStoryEvents(dataset).find((event) => event.type === "lead-change")?.title).toBe("Beta takes the lead");
  });
});
