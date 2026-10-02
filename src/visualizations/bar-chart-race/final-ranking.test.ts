import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";
import { defaultBarChartRaceConfig } from "@/lib/project/defaults";
import { getFinalRanking } from "@/visualizations/bar-chart-race/final-ranking";

describe("getFinalRanking", () => {
  it("derives the result from the same frame state as the race", () => {
    const dataset = normalizeDataset(
      [
        { year: 2020, entity: "A", value: 10 },
        { year: 2020, entity: "B", value: 20 },
        { year: 2021, entity: "A", value: 30 },
        { year: 2021, entity: "B", value: 25 },
      ],
      { time: "year", category: "entity", value: "value" },
    ).dataset;
    if (!dataset) throw new Error("Fixture normalization failed");
    expect(getFinalRanking(dataset, defaultBarChartRaceConfig, 30, 2).map((item) => item.label)).toEqual(["A", "B"]);
  });
});
