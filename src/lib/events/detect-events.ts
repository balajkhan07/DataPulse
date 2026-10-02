import type { NormalizedDataset } from "@/types/data";
import type { EventSettings, StoryEvent, StoryEventType } from "@/types/story";

export interface EventDetectionOptions {
  topN: number;
  majorRankChange: number;
  milestones: number[];
  enabledTypes?: StoryEventType[];
}

const defaultOptions: EventDetectionOptions = {
  topN: 10,
  majorRankChange: 3,
  milestones: [],
};

function ranking(dataset: NormalizedDataset, periodIndex: number): string[] {
  const period = dataset.periods[periodIndex];
  return Object.values(period.points)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .map((point) => point.entityId);
}

function createEvent(
  type: StoryEventType,
  dataset: NormalizedDataset,
  periodIndex: number,
  entityIds: string[],
  importance: number,
  data: StoryEvent["data"],
): StoryEvent {
  const period = dataset.periods[periodIndex];
  return {
    id: `${type}-${period.time}-${entityIds.join("-")}-${Object.values(data).join("-")}`,
    type,
    time: period.time,
    timeLabel: period.label,
    periodIndex,
    entityIds,
    importance: Math.round(Math.max(0, Math.min(100, importance))),
    data,
  };
}

export function detectStoryEvents(dataset: NormalizedDataset, providedOptions: Partial<EventDetectionOptions> = {}): StoryEvent[] {
  const options = { ...defaultOptions, ...providedOptions };
  const events: StoryEvent[] = [];
  const recordByEntity: Record<string, number> = {};

  Object.values(dataset.periods[0]?.points ?? {}).forEach((point) => {
    recordByEntity[point.entityId] = point.value;
  });

  for (let index = 1; index < dataset.periods.length; index += 1) {
    const previous = ranking(dataset, index - 1);
    const current = ranking(dataset, index);
    const previousPeriod = dataset.periods[index - 1];
    const currentPeriod = dataset.periods[index];

    if (previous[0] && current[0] && previous[0] !== current[0]) {
      events.push(createEvent("lead-change", dataset, index, [current[0], previous[0]], 100, {
        previousLeaderId: previous[0],
        newLeaderId: current[0],
      }));
    }

    const previousTop = new Set(previous.slice(0, options.topN));
    const currentTop = new Set(current.slice(0, options.topN));
    current.slice(0, options.topN).forEach((entityId, rank) => {
      if (!previousTop.has(entityId)) {
        events.push(createEvent("top-entry", dataset, index, [entityId], 76 - rank * 2, { rank: rank + 1, topN: options.topN }));
      }
    });
    previous.slice(0, options.topN).forEach((entityId, previousRank) => {
      if (!currentTop.has(entityId)) {
        events.push(createEvent("top-exit", dataset, index, [entityId], 66 - previousRank, { previousRank: previousRank + 1, topN: options.topN }));
      }
    });

    current.forEach((entityId, rank) => {
      const previousRank = previous.indexOf(entityId);
      if (previousRank < 0) return;
      const rankChange = previousRank - rank;
      if (rankChange >= options.majorRankChange) {
        events.push(createEvent("major-rise", dataset, index, [entityId], 62 + rankChange * 5, {
          fromRank: previousRank + 1,
          toRank: rank + 1,
          change: rankChange,
        }));
      }
      if (rankChange <= -options.majorRankChange) {
        events.push(createEvent("major-fall", dataset, index, [entityId], 60 + Math.abs(rankChange) * 5, {
          fromRank: previousRank + 1,
          toRank: rank + 1,
          change: rankChange,
        }));
      }
    });

    let fastestEntityId: string | null = null;
    let fastestGrowth = Number.NEGATIVE_INFINITY;
    Object.values(currentPeriod.points).forEach((point) => {
      const previousValue = previousPeriod.points[point.entityId]?.value ?? 0;
      const absoluteGrowth = point.value - previousValue;
      if (absoluteGrowth > fastestGrowth) {
        fastestGrowth = absoluteGrowth;
        fastestEntityId = point.entityId;
      }

      const previousRecord = recordByEntity[point.entityId] ?? Number.NEGATIVE_INFINITY;
      if (point.value > previousRecord) {
        const relativeGain = previousRecord > 0 ? (point.value - previousRecord) / previousRecord : 0;
        events.push(createEvent("record-value", dataset, index, [point.entityId], 48 + Math.min(30, relativeGain * 100), {
          value: point.value,
          previousRecord: Number.isFinite(previousRecord) ? previousRecord : 0,
        }));
        recordByEntity[point.entityId] = point.value;
      }

      for (const milestone of options.milestones) {
        if (previousValue < milestone && point.value >= milestone) {
          events.push(createEvent("milestone", dataset, index, [point.entityId], 84, { milestone, value: point.value }));
        }
      }
    });

    if (fastestEntityId && fastestGrowth > 0) {
      events.push(createEvent("fastest-growth", dataset, index, [fastestEntityId], 58, { absoluteGrowth: fastestGrowth }));
    }
  }

  const enabled = options.enabledTypes ? new Set(options.enabledTypes) : null;
  return events
    .filter((item) => !enabled || enabled.has(item.type))
    .sort((a, b) => a.time - b.time || b.importance - a.importance || a.id.localeCompare(b.id));
}

export function eventOptionsFromSettings(settings: EventSettings): EventDetectionOptions {
  return {
    topN: settings.topN,
    majorRankChange: settings.majorRankChange,
    milestones: settings.milestones,
    enabledTypes: settings.enabledTypes,
  };
}
