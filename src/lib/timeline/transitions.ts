import { applyEasing } from "@/lib/animation/easing";
import { calculateSceneSchedule, getActiveScene } from "@/lib/timeline/timeline";
import type { StoryScene, TimelineConfig } from "@/types/story";

export interface StoryRenderLayer {
  key: string;
  scene: StoryScene;
  localFrame: number;
  opacity: number;
  translateXPercent: number;
}

export function getStoryRenderLayers(timeline: TimelineConfig, frame: number): StoryRenderLayer[] {
  const active = getActiveScene(timeline, frame);
  if (!active) return [];
  const schedule = calculateSceneSchedule(timeline);
  const activeIndex = schedule.findIndex((entry) => entry.scene.id === active.scene.id);
  const transition = active.scene.entryTransition;
  const transitionFrames = Math.min(active.scene.durationFrames, Math.max(0, transition.durationFrames));
  if (activeIndex <= 0 || transition.type === "cut" || transitionFrames === 0 || active.localFrame >= transitionFrames) {
    return [{ key: active.scene.id, scene: active.scene, localFrame: active.localFrame, opacity: 1, translateXPercent: 0 }];
  }

  const previous = schedule[activeIndex - 1];
  const progress = applyEasing(active.localFrame / transitionFrames, "easeInOut");
  const previousLayer: StoryRenderLayer = {
    key: `${previous.scene.id}-transition`,
    scene: previous.scene,
    localFrame: Math.max(0, previous.scene.durationFrames - 1),
    opacity: transition.type === "crossfade" ? 1 - progress : 1,
    translateXPercent: transition.type === "slide" ? -8 * progress : 0,
  };
  const activeLayer: StoryRenderLayer = {
    key: active.scene.id,
    scene: active.scene,
    localFrame: active.localFrame,
    opacity: progress,
    translateXPercent: transition.type === "slide" ? (1 - progress) * 100 : 0,
  };

  if (transition.type === "fade") return [activeLayer];
  return [previousLayer, activeLayer];
}
