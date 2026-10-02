import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";
import { defaultBarChartRaceConfig } from "@/lib/project/defaults";
import { getBarChartRaceState } from "@/visualizations/bar-chart-race/state";

const dataset = normalizeDataset(
  [
    { year: "2020", company: "Alpha", value: "100" },
    { year: "2020", company: "Beta", value: "50" },
    { year: "2021", company: "Alpha", value: "100" },
    { year: "2021", company: "Beta", value: "150" },
  ],
  { time: "year", category: "company", value: "value" },
).dataset;

describe("bar chart race state", () => {
  it("interpolates values and positions deterministically", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const config = { ...defaultBarChartRaceConfig, secondsPerPeriod: 1, easing: "linear" as const };
    const midpoint = getBarChartRaceState({ dataset, config, frame: 15, fps: 30 });
    const beta = midpoint.items.find((item) => item.entityId === "beta");

    expect(beta?.value).toBe(100);
    expect(beta?.position).toBe(0.5);
    expect(midpoint.timeLabel).toBe("2021");
  });

  it("returns identical state for the same frame", () => {
    if (!dataset) throw new Error("Fixture normalization failed");
    const args = { dataset, config: defaultBarChartRaceConfig, frame: 22, fps: 30 };
    expect(getBarChartRaceState(args)).toEqual(getBarChartRaceState(args));
  });
});
