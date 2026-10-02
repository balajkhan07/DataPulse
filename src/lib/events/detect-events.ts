import type { NormalizedDataset } from "@/types/data";

export interface StoryEvent {
  id: string;
  type: "lead-change" | "top-entry" | "major-rise";
  time: number;
  timeLabel: string;
  entityIds: string[];
  importance: number;
  title: string;
  metadata?: Record<string, unknown>;
}

function ranking(dataset: NormalizedDataset, periodIndex: number): string[] {
  const period = dataset.periods[periodIndex];
  return Object.values(period.points)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .map((point) => point.entityId);
}

export function detectStoryEvents(dataset: NormalizedDataset, topN = 10): StoryEvent[] {
  const events: StoryEvent[] = [];

  for (let index = 1; index < dataset.periods.length; index += 1) {
    const previous = ranking(dataset, index - 1);
    const current = ranking(dataset, index);
    const period = dataset.periods[index];

    if (previous[0] && current[0] && previous[0] !== current[0]) {
      events.push({
        id: `lead-${period.time}-${current[0]}`,
        type: "lead-change",
        time: period.time,
        timeLabel: period.label,
        entityIds: [current[0], previous[0]],
        importance: 1,
        title: `${dataset.entities[current[0]].label} takes the lead`,
      });
    }

    const previousTop = new Set(previous.slice(0, topN));
    current.slice(0, topN).forEach((entityId, rank) => {
      if (!previousTop.has(entityId)) {
        events.push({
          id: `entry-${period.time}-${entityId}`,
          type: "top-entry",
          time: period.time,
          timeLabel: period.label,
          entityIds: [entityId],
          importance: Math.max(0.4, 0.8 - rank * 0.04),
          title: `${dataset.entities[entityId].label} enters the top ${topN}`,
          metadata: { rank: rank + 1 },
        });
      }
    });

    current.forEach((entityId, rank) => {
      const previousRank = previous.indexOf(entityId);
      if (previousRank >= 0 && previousRank - rank >= 3) {
        events.push({
          id: `rise-${period.time}-${entityId}`,
          type: "major-rise",
          time: period.time,
          timeLabel: period.label,
          entityIds: [entityId],
          importance: Math.min(0.9, 0.5 + (previousRank - rank) * 0.06),
          title: `${dataset.entities[entityId].label} jumps to #${rank + 1}`,
          metadata: { fromRank: previousRank + 1, toRank: rank + 1 },
        });
      }
    });
  }

  return events.sort((a, b) => a.time - b.time || b.importance - a.importance);
}
