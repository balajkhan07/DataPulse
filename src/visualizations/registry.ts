import type { BarChartRaceConfig } from "@/types/project";
import type { VisualizationDefinition } from "@/types/visualization";
import { barChartRaceDefinition } from "@/visualizations/bar-chart-race";
import type { BarChartRaceState } from "@/visualizations/bar-chart-race/types";

export const visualizationRegistry = {
  "bar-chart-race": barChartRaceDefinition,
} satisfies Record<string, VisualizationDefinition<BarChartRaceConfig, BarChartRaceState>>;

export type VisualizationId = keyof typeof visualizationRegistry;

export function getVisualizationDefinition(id: VisualizationId) {
  return visualizationRegistry[id];
}
