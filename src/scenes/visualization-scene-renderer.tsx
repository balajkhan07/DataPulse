"use client";

import { useMemo } from "react";
import { createAnnotationSchedule, getActiveAnnotation } from "@/lib/events/annotations";
import { detectStoryEvents, eventOptionsFromSettings } from "@/lib/events/detect-events";
import { mapSceneFrame } from "@/lib/timeline/timeline";
import { AnnotationOverlay } from "@/scenes/annotation-overlay";
import type { SceneRendererProps } from "@/scenes/types";
import { getBarChartRaceTotalFrames } from "@/visualizations/bar-chart-race/state";
import { getVisualizationDefinition } from "@/visualizations/registry";
import type { StoryScene } from "@/types/story";

export function VisualizationSceneRenderer({ project, dataset, scene, localFrame }: SceneRendererProps) {
  if (scene.type !== "visualization") return null;
  return <VisualizationSceneContent dataset={dataset} localFrame={localFrame} project={project} scene={scene} />;
}

function VisualizationSceneContent({
  project,
  dataset,
  scene,
  localFrame,
}: Omit<SceneRendererProps, "scene"> & { scene: Extract<StoryScene, { type: "visualization" }> }) {
  const definition = getVisualizationDefinition(project.visualizationType);
  const chartDuration = getBarChartRaceTotalFrames(dataset, project.video.fps, project.visualization.secondsPerPeriod);
  const chartFrame = mapSceneFrame(localFrame, scene.durationFrames, chartDuration);
  const state = definition.getStateAtFrame({
    dataset,
    frame: chartFrame,
    fps: project.video.fps,
    config: project.visualization,
  });
  const annotations = useMemo(
    () => createAnnotationSchedule(
      detectStoryEvents(dataset, eventOptionsFromSettings(project.events)),
      dataset,
      getBarChartRaceTotalFrames(dataset, project.video.fps, project.visualization.secondsPerPeriod),
      project.video.fps,
      project.events,
      project.visualization,
    ),
    [dataset, project.events, project.video.fps, project.visualization],
  );
  const annotation = scene.config.annotationsEnabled ? getActiveAnnotation(annotations, chartFrame) : null;
  const Renderer = definition.Renderer;

  return (
    <div className="relative h-full w-full">
      <Renderer
        config={project.visualization}
        footer={project.content.footer}
        highlightedEntityIds={annotation?.entityIds}
        source={project.content.source}
        state={state}
        subtitle={project.content.subtitle}
        themeId={project.themeId}
        title={project.content.title}
        video={project.video}
      />
      {annotation && <AnnotationOverlay annotation={annotation} frame={chartFrame} themeId={project.themeId} video={project.video} />}
    </div>
  );
}
