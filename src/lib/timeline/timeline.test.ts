import { describe, expect, it } from "vitest";
import { createDefaultTimeline } from "@/lib/project/defaults";
import { calculateSceneSchedule, getActiveScene, getTimelineDuration, mapSceneFrame, moveScene } from "@/lib/timeline/timeline";

describe("timeline calculations", () => {
  it("calculates contiguous enabled scene timing", () => {
    const timeline = createDefaultTimeline(30, 300);
    timeline.scenes[3].enabled = false;
    const schedule = calculateSceneSchedule(timeline);
    expect(schedule.map(({ startFrame, endFrame }) => [startFrame, endFrame])).toEqual([[0, 60], [60, 360], [360, 450]]);
    expect(getTimelineDuration(timeline)).toBe(450);
    expect(getActiveScene(timeline, 75)?.scene.type).toBe("visualization");
    expect(getActiveScene(timeline, 75)?.localFrame).toBe(15);
  });

  it("maps scene time to intrinsic visualization time", () => {
    expect(mapSceneFrame(50, 101, 201)).toBe(100);
  });

  it("reorders scenes without mutating the input", () => {
    const timeline = createDefaultTimeline(30);
    const moved = moveScene(timeline, "scene-final", -1);
    expect(moved.scenes.map((scene) => scene.type)).toEqual(["hook", "final-ranking", "visualization", "outro"]);
    expect(timeline.scenes[1].type).toBe("visualization");
  });
});
