"use client";

import { useId } from "react";
import { applyEasing } from "@/lib/animation/easing";
import { getTheme } from "@/themes";
import { SceneBackground, splitSceneTitle } from "@/scenes/scene-background";
import type { SceneRendererProps } from "@/scenes/types";

export function OutroSceneRenderer({ project, scene, localFrame }: SceneRendererProps) {
  const id = useId().replaceAll(":", "");
  if (scene.type !== "outro") return null;
  const { width, height } = project.video;
  const theme = getTheme(project.themeId);
  const minDimension = Math.min(width, height);
  const progress = applyEasing(Math.min(1, localFrame / Math.max(1, project.video.fps * 0.6)), "easeOut");
  const lines = splitSceneTitle(scene.config.title, height > width ? 20 : 34);
  const titleSize = minDimension * (height > width ? 0.095 : 0.075);

  return (
    <svg aria-label={`Outro scene: ${scene.config.title}`} className="h-full w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
      <SceneBackground height={height} id={id} themeId={project.themeId} width={width} />
      <g fontFamily={theme.fontFamily} opacity={progress} textAnchor="middle" transform={`translate(0 ${(1 - progress) * minDimension * 0.06})`}>
        <circle cx={width / 2} cy={height * 0.27} fill={theme.background.accent} opacity="0.16" r={minDimension * 0.095} />
        <circle cx={width / 2} cy={height * 0.27} fill="none" r={minDimension * 0.055} stroke={theme.background.accent} strokeWidth={minDimension * 0.009} />
        {lines.map((line, index) => (
          <text fill={theme.text.primary} fontSize={titleSize} fontWeight="820" key={`${line}-${index}`} letterSpacing={-titleSize * 0.04} x={width / 2} y={height * 0.48 + index * titleSize * 1.04}>
            {line}
          </text>
        ))}
        <text fill={theme.text.secondary} fontSize={minDimension * 0.032} fontWeight="580" x={width / 2} y={height * 0.48 + lines.length * titleSize * 1.18}>
          {scene.config.cta}
        </text>
        <text fill={theme.text.muted} fontSize={minDimension * 0.018} fontWeight="700" letterSpacing={minDimension * 0.003} x={width / 2} y={height - project.video.safeArea.bottom * 0.65}>
          {project.content.source.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
