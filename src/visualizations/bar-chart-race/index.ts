import { defaultBarChartRaceConfig } from "@/lib/project/defaults";
import type { BarChartRaceConfig } from "@/types/project";
import type { VisualizationDefinition } from "@/types/visualization";
import { BarChartRaceRenderer } from "@/visualizations/bar-chart-race/renderer";
import { getBarChartRaceState } from "@/visualizations/bar-chart-race/state";
import type { BarChartRaceState } from "@/visualizations/bar-chart-race/types";

export const barChartRaceDefinition: VisualizationDefinition<BarChartRaceConfig, BarChartRaceState> = {
  id: "bar-chart-race",
  name: "Bar chart race",
  validateDataset: (dataset) => {
    const issues = [];
    if (dataset.periods.length < 2) {
      issues.push({
        code: "visualization.periods",
        message: "A bar chart race needs at least two time periods.",
        severity: "error" as const,
      });
    }
    return issues;
  },
  getDefaultConfig: () => ({ ...defaultBarChartRaceConfig }),
  getStateAtFrame: getBarChartRaceState,
  Renderer: BarChartRaceRenderer,
};
