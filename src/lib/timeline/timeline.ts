import type { StoryScene, TimelineConfig } from "@/types/story";

export interface ScheduledScene {
  scene: StoryScene;
  startFrame: number;
  endFrame: number;
}

export interface ActiveScene extends ScheduledScene {
  localFrame: number;
}

export function calculateSceneSchedule(timeline: TimelineConfig): ScheduledScene[] {
  let startFrame = 0;
  return timeline.scenes.flatMap((scene) => {
    if (!scene.enabled) return [];
    const durationFrames = Math.max(1, Math.round(scene.durationFrames));
    const scheduled = { scene, startFrame, endFrame: startFrame + durationFrames };
    startFrame += durationFrames;
    return [scheduled];
  });
}

export function getTimelineDuration(timeline: TimelineConfig): number {
  return calculateSceneSchedule(timeline).at(-1)?.endFrame ?? 1;
}

export function getActiveScene(timeline: TimelineConfig, frame: number): ActiveScene | null {
  const schedule = calculateSceneSchedule(timeline);
  if (schedule.length === 0) return null;
  const clampedFrame = Math.max(0, Math.min(frame, getTimelineDuration(timeline) - 1));
  const scheduled = schedule.find((entry) => clampedFrame < entry.endFrame) ?? schedule.at(-1);
  if (!scheduled) return null;
  return { ...scheduled, localFrame: clampedFrame - scheduled.startFrame };
}

export function getSceneStartFrame(timeline: TimelineConfig, sceneId: string): number | null {
  return calculateSceneSchedule(timeline).find((entry) => entry.scene.id === sceneId)?.startFrame ?? null;
}

export function mapSceneFrame(localFrame: number, sceneDuration: number, targetDuration: number): number {
  if (sceneDuration <= 1 || targetDuration <= 1) return 0;
  const progress = Math.max(0, Math.min(1, localFrame / (sceneDuration - 1)));
  return progress * (targetDuration - 1);
}

export function moveScene(timeline: TimelineConfig, sceneId: string, direction: -1 | 1): TimelineConfig {
  const scenes = [...timeline.scenes];
  const index = scenes.findIndex((scene) => scene.id === sceneId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= scenes.length) return timeline;
  [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
  return { scenes };
}
