import { describe, expect, it } from "vitest";
import { createDefaultTimeline } from "@/lib/project/defaults";
import { getStoryRenderLayers } from "@/lib/timeline/transitions";

describe("deterministic scene transitions", () => {
  it("crossfades from the frozen final frame of the preceding scene", () => {
    const timeline = createDefaultTimeline(30, 300);
    const startFrame = timeline.scenes[0].durationFrames;
    const atStart = getStoryRenderLayers(timeline, startFrame);
    expect(atStart.map((layer) => layer.scene.type)).toEqual(["hook", "visualization"]);
    expect(atStart[0].localFrame).toBe(timeline.scenes[0].durationFrames - 1);
    expect(atStart.map((layer) => layer.opacity)).toEqual([1, 0]);
    const middle = getStoryRenderLayers(timeline, startFrame + 7);
    expect(middle[0].opacity + middle[1].opacity).toBeCloseTo(1);
  });

  it("renders only the incoming scene for a fade from background", () => {
    const timeline = createDefaultTimeline(30, 300);
    timeline.scenes[1].entryTransition = { type: "fade", durationFrames: 15 };
    expect(getStoryRenderLayers(timeline, timeline.scenes[0].durationFrames + 5)).toHaveLength(1);
  });

  it("slides the incoming layer from the right", () => {
    const timeline = createDefaultTimeline(30, 300);
    timeline.scenes[1].entryTransition = { type: "slide", durationFrames: 15 };
    const layers = getStoryRenderLayers(timeline, timeline.scenes[0].durationFrames);
    expect(layers[1].translateXPercent).toBe(100);
  });
});
