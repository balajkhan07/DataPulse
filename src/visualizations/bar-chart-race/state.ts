import { applyEasing, lerp } from "@/lib/animation/easing";
import type { NormalizedDataset } from "@/types/data";
import type { BarChartRaceConfig } from "@/types/project";
import type { VisualizationStateArgs } from "@/types/visualization";
import type { BarChartItemState, BarChartRaceState } from "@/visualizations/bar-chart-race/types";

function lastKnownValue(dataset: NormalizedDataset, entityId: string, periodIndex: number): number {
  for (let index = periodIndex; index >= 0; index -= 1) {
    const point = dataset.periods[index]?.points[entityId];
    if (point) return point.value;
  }
  return 0;
}

function valueAt(dataset: NormalizedDataset, entityId: string, periodIndex: number, config: BarChartRaceConfig): number {
  const value = dataset.periods[periodIndex]?.points[entityId]?.value;
  if (value !== undefined) return value;
  return config.missingValueStrategy === "carry" ? lastKnownValue(dataset, entityId, periodIndex) : 0;
}

function rankValues(values: Record<string, number>, labels: Record<string, string>): Record<string, number> {
  return Object.keys(values)
    .sort((a, b) => values[b] - values[a] || labels[a].localeCompare(labels[b]))
    .reduce<Record<string, number>>((result, id, index) => {
      result[id] = index;
      return result;
    }, {});
}

function timeLabelAt(dataset: NormalizedDataset, periodIndex: number, nextPeriodIndex: number, progress: number): string {
  const start = dataset.periods[periodIndex];
  const end = dataset.periods[nextPeriodIndex];
  if (!start || !end || start === end) return start?.label ?? "";

  const startNumber = Number(start.label);
  const endNumber = Number(end.label);
  if (Number.isFinite(startNumber) && Number.isFinite(endNumber)) {
    return String(Math.round(lerp(startNumber, endNumber, progress)));
  }
  return progress < 0.5 ? start.label : end.label;
}

export function getBarChartRaceTotalFrames(dataset: NormalizedDataset, fps: number, secondsPerPeriod: number): number {
  return Math.max(1, Math.round(Math.max(1, dataset.periods.length - 1) * fps * secondsPerPeriod));
}

export function getBarChartRaceState({ dataset, frame, fps, config }: VisualizationStateArgs<BarChartRaceConfig>): BarChartRaceState {
  if (dataset.periods.length === 0) {
    return { items: [], timeLabel: "", periodIndex: 0, periodProgress: 0, maxValue: 1 };
  }

  const framesPerPeriod = Math.max(1, fps * config.secondsPerPeriod);
  const timelinePosition = Math.max(0, frame) / framesPerPeriod;
  const periodIndex = Math.min(dataset.periods.length - 1, Math.floor(timelinePosition));
  const nextPeriodIndex = Math.min(dataset.periods.length - 1, periodIndex + 1);
  const rawProgress = periodIndex === nextPeriodIndex ? 1 : timelinePosition - periodIndex;
  const progress = applyEasing(rawProgress, config.easing);
  const entityIds = Object.keys(dataset.entities);
  const labels = Object.fromEntries(entityIds.map((id) => [id, dataset.entities[id].label]));
  const startValues = Object.fromEntries(entityIds.map((id) => [id, valueAt(dataset, id, periodIndex, config)]));
  const endValues = Object.fromEntries(entityIds.map((id) => [id, valueAt(dataset, id, nextPeriodIndex, config)]));
  const currentValues = Object.fromEntries(entityIds.map((id) => [id, lerp(startValues[id], endValues[id], progress)]));
  const startRanks = rankValues(startValues, labels);
  const endRanks = rankValues(endValues, labels);
  const currentRanks = rankValues(currentValues, labels);

  const items = entityIds
    .map<BarChartItemState>((id) => {
      const entity = dataset.entities[id];
      const position = lerp(startRanks[id], endRanks[id], progress);
      const opacityBoundary = config.topN - 0.15;
      const opacity = Math.max(0, Math.min(1, opacityBoundary - position + 1));
      return {
        entityId: id,
        label: entity.label,
        value: currentValues[id],
        rank: currentRanks[id] + 1,
        position,
        opacity,
        color: entity.color,
        image: entity.image,
      };
    })
    .filter((item) => item.opacity > 0 && item.value >= 0)
    .sort((a, b) => a.position - b.position);

  return {
    items,
    timeLabel: timeLabelAt(dataset, periodIndex, nextPeriodIndex, progress),
    periodIndex,
    periodProgress: progress,
    maxValue: Math.max(1, ...items.map((item) => item.value)),
  };
}
