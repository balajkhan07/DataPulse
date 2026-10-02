import { formatValue } from "@/lib/formatting/number";
import type { NormalizedDataset } from "@/types/data";
import type { BarChartRaceConfig } from "@/types/project";
import type { EventPresentation, StoryEvent } from "@/types/story";

export function presentStoryEvent(
  event: StoryEvent,
  dataset: NormalizedDataset,
  valueConfig: BarChartRaceConfig,
): EventPresentation {
  const label = dataset.entities[event.entityIds[0]]?.label ?? "An entity";
  const secondLabel = dataset.entities[event.entityIds[1]]?.label;
  switch (event.type) {
    case "lead-change":
      return { title: `${label} takes the lead`, description: secondLabel ? `Moves ahead of ${secondLabel}` : undefined };
    case "major-rise":
      return { title: `${label} surges to #${event.data.toRank}`, description: `Up ${event.data.change} positions` };
    case "major-fall":
      return { title: `${label} falls to #${event.data.toRank}`, description: `Down ${Math.abs(Number(event.data.change))} positions` };
    case "top-entry":
      return { title: `${label} enters the top ${event.data.topN}`, description: `Arrives at #${event.data.rank}` };
    case "top-exit":
      return { title: `${label} leaves the top ${event.data.topN}`, description: `Previously ranked #${event.data.previousRank}` };
    case "milestone":
      return { title: `${label} crosses a milestone`, description: formatValue(Number(event.data.milestone), valueConfig) };
    case "record-value":
      return { title: `${label} sets a new record`, description: formatValue(Number(event.data.value), valueConfig) };
    case "fastest-growth":
      return { title: `${label} grows fastest`, description: `+${formatValue(Number(event.data.absoluteGrowth), valueConfig)}` };
  }
}
