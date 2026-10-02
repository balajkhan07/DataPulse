import { presentStoryEvent } from "@/lib/events/presentation";
import type { NormalizedDataset } from "@/types/data";
import type { BarChartRaceConfig } from "@/types/project";
import type { EventSettings, ScheduledAnnotation, StoryEvent } from "@/types/story";

const minimumGapSeconds = { low: 4.5, medium: 2.8, high: 1.4 } as const;
const maximumAnnotations = { low: 4, medium: 8, high: 14 } as const;

export function createAnnotationSchedule(
  events: StoryEvent[],
  dataset: NormalizedDataset,
  chartDurationFrames: number,
  fps: number,
  settings: EventSettings,
  valueConfig: BarChartRaceConfig,
): ScheduledAnnotation[] {
  if (!settings.enabled || dataset.periods.length < 2) return [];
  const gap = Math.round(minimumGapSeconds[settings.frequency] * fps);
  const candidates = events
    .filter((item) => item.importance >= settings.minimumImportance)
    .map((item) => ({
      event: item,
      startFrame: Math.round((item.periodIndex / (dataset.periods.length - 1)) * Math.max(1, chartDurationFrames - 1)),
    }))
    .sort((a, b) => a.startFrame - b.startFrame || b.event.importance - a.event.importance);

  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    const last = selected.at(-1);
    if (last && candidate.startFrame - last.startFrame < gap) {
      if (candidate.event.importance > last.event.importance) selected[selected.length - 1] = candidate;
      continue;
    }
    selected.push(candidate);
  }

  return selected.slice(0, maximumAnnotations[settings.frequency]).map(({ event, startFrame }) => ({
    eventId: event.id,
    eventType: event.type,
    startFrame,
    durationFrames: settings.durationFrames,
    entityIds: event.entityIds,
    importance: event.importance,
    ...presentStoryEvent(event, dataset, valueConfig),
  }));
}

export function getActiveAnnotation(annotations: ScheduledAnnotation[], frame: number): ScheduledAnnotation | null {
  return annotations.find((annotation) => frame >= annotation.startFrame && frame < annotation.startFrame + annotation.durationFrames) ?? null;
}
