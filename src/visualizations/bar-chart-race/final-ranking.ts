import type { NormalizedDataset } from "@/types/data";
import type { BarChartRaceConfig } from "@/types/project";
import { getBarChartRaceState, getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";
import type { BarChartItemState } from "@/visualizations/bar-chart-race/types";

export function getFinalRanking(
  dataset: NormalizedDataset,
  config: BarChartRaceConfig,
  fps: number,
  topN: number,
): BarChartItemState[] {
  const finalFrame = getBarChartRaceTotalFrames(dataset, fps, config.secondsPerPeriod);
  return getBarChartRaceState({ dataset, frame: finalFrame, fps, config })
    .items
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN);
}
