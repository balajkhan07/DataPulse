import type { AudioConfig } from "@/types/export";

export interface AudioTiming {
  startFrame: number;
  trimBeforeFrames: number;
  sourceDurationFrames: number;
  outputDurationFrames: number;
  loop: boolean;
}

export function getAudioTiming(audio: AudioConfig, timelineFrames: number, fps: number): AudioTiming | null {
  if (!audio.enabled || !audio.assetId || !audio.durationSeconds) return null;
  const startFrame = Math.max(0, Math.round(audio.startOffsetSeconds * fps));
  if (startFrame >= timelineFrames) return null;
  const trimStart = Math.min(audio.durationSeconds, Math.max(0, audio.trimStartSeconds));
  const trimEnd = Math.min(audio.durationSeconds, Math.max(trimStart, audio.trimEndSeconds ?? audio.durationSeconds));
  const sourceDurationFrames = Math.max(1, Math.round((trimEnd - trimStart) * fps));
  const availableTimelineFrames = Math.max(1, timelineFrames - startFrame);
  return {
    startFrame,
    trimBeforeFrames: Math.round(trimStart * fps),
    sourceDurationFrames,
    outputDurationFrames: audio.loop ? availableTimelineFrames : Math.min(sourceDurationFrames, availableTimelineFrames),
    loop: audio.loop,
  };
}

export function getAudioVolume(audio: AudioConfig, localFrame: number, outputDurationFrames: number, fps: number): number {
  const fadeInFrames = Math.max(0, Math.round(audio.fadeInSeconds * fps));
  const fadeOutFrames = Math.max(0, Math.round(audio.fadeOutSeconds * fps));
  const fadeIn = fadeInFrames === 0 ? 1 : Math.min(1, localFrame / fadeInFrames);
  const framesRemaining = Math.max(0, outputDurationFrames - 1 - localFrame);
  const fadeOut = fadeOutFrames === 0 ? 1 : Math.min(1, framesRemaining / fadeOutFrames);
  return Math.max(0, Math.min(1, audio.volume * fadeIn * fadeOut));
}
