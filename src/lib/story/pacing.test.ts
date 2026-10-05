import { describe, expect, it } from "vitest";
import { createAdaptivePacingPlan, mapFrameWithAdaptivePacing } from "@/lib/story/pacing";

describe("adaptive pacing", () => {
  it("allocates more time to important periods while preserving total duration", () => {
    const plan = createAdaptivePacingPlan(4, [{ periodIndex: 2, time: 2, timeLabel: "2", score: 100, reasons: [], eventIds: [], rankChanges: 4, absoluteChange: 20 }], "high");
    expect(plan.weights[1]).toBeGreaterThan(plan.weights[0]);
    expect(plan.weights[1] / plan.totalWeight).toBeGreaterThan(1 / 3);
    expect(mapFrameWithAdaptivePacing(0, 101, 301, plan)).toBe(0);
    expect(mapFrameWithAdaptivePacing(100, 101, 301, plan)).toBe(300);
    expect(mapFrameWithAdaptivePacing(25, 101, 301, plan)).toBeGreaterThan(75);
    expect(mapFrameWithAdaptivePacing(75, 101, 301, plan)).toBeLessThan(225);
  });
});
