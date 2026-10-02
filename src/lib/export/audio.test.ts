import { describe, expect, it } from "vitest";
import { getAudioTiming, getAudioVolume } from "@/lib/export/audio";
import { defaultAudioConfig } from "@/lib/project/defaults";

describe("audio timing", () => {
  it("maps offsets and trims to deterministic frames", () => {
    const timing = getAudioTiming({
      ...defaultAudioConfig,
      enabled: true,
      assetId: "audio-id",
      durationSeconds: 12,
      startOffsetSeconds: 2,
      trimStartSeconds: 1,
      trimEndSeconds: 7,
    }, 300, 30);
    expect(timing).toEqual({ startFrame: 60, trimBeforeFrames: 30, sourceDurationFrames: 180, outputDurationFrames: 180, loop: false });
  });

  it("loops a trimmed source across the remaining timeline", () => {
    const timing = getAudioTiming({ ...defaultAudioConfig, enabled: true, assetId: "audio-id", durationSeconds: 3, loop: true }, 300, 30);
    expect(timing?.sourceDurationFrames).toBe(90);
    expect(timing?.outputDurationFrames).toBe(300);
  });

  it("applies fade envelopes and ignores audio starting after the story", () => {
    const audio = { ...defaultAudioConfig, enabled: true, assetId: "audio-id", durationSeconds: 10, volume: 0.8, fadeInSeconds: 1, fadeOutSeconds: 1 };
    expect(getAudioVolume(audio, 0, 300, 30)).toBe(0);
    expect(getAudioVolume(audio, 30, 300, 30)).toBeCloseTo(0.8);
    expect(getAudioVolume(audio, 299, 300, 30)).toBe(0);
    expect(getAudioTiming({ ...audio, startOffsetSeconds: 11 }, 300, 30)).toBeNull();
  });
});
