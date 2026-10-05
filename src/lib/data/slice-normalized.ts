import type { NormalizedDataset } from "@/types/data";

export function sliceNormalizedDataset(dataset: NormalizedDataset, requestedStart: number | null, requestedEnd: number | null): NormalizedDataset {
  const lastIndex = Math.max(0, dataset.periods.length - 1);
  const start = Math.max(0, Math.min(lastIndex, requestedStart ?? 0));
  const end = Math.max(start, Math.min(lastIndex, requestedEnd ?? lastIndex));
  const periods = dataset.periods.slice(start, end + 1);
  const points = periods.flatMap((period) => Object.values(period.points));
  const entityIds = new Set(points.map((point) => point.entityId));
  const entities = Object.fromEntries(Object.entries(dataset.entities).filter(([entityId]) => entityIds.has(entityId)));
  const values = points.map((point) => point.value);
  return {
    periods,
    points,
    entities,
    minValue: values.length > 0 ? Math.min(...values) : 0,
    maxValue: values.length > 0 ? Math.max(...values) : 0,
  };
}
