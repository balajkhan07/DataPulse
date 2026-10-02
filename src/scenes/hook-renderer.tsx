"use client";

import { useId } from "react";
import { applyEasing } from "@/lib/animation/easing";
import { getTheme } from "@/themes";
import { SceneBackground, splitSceneTitle } from "@/scenes/scene-background";
import type { SceneRendererProps } from "@/scenes/types";

export function HookSceneRenderer({ project, scene, localFrame }: SceneRendererProps) {
  const id = useId().replaceAll(":", "");
  if (scene.type !== "hook") return null;
  const { width, height } = project.video;
  const theme = getTheme(project.themeId);
  const minDimension = Math.min(width, height);
  const portrait = height > width;
  const enterProgress = applyEasing(Math.min(1, localFrame / Math.max(1, project.video.fps * 0.7)), "easeOut");
  const exitFrames = Math.min(project.video.fps * 0.45, scene.durationFrames * 0.25);
  const exitProgress = Math.max(0, (localFrame - (scene.durationFrames - exitFrames)) / Math.max(1, exitFrames));
  const opacity = 1 - exitProgress;
  const offset = scene.config.transition === "rise" ? (1 - enterProgress) * minDimension * 0.08 : 0;
  const titleSize = minDimension * (portrait ? 0.094 : 0.078);
  const contentX = project.video.safeArea.left;
  const contentY = height * (portrait ? 0.32 : 0.3);
  const lines = splitSceneTitle(scene.config.title, portrait ? 21 : 34);

  return (
    <svg aria-label={`Hook scene: ${scene.config.title}`} role="img" style={{ height: "100%", width: "100%" }} viewBox={`0 0 ${width} ${height}`}>
      <SceneBackground height={height} id={id} themeId={project.themeId} variant={scene.config.background} width={width} />
      <g fontFamily={theme.fontFamily} opacity={opacity} transform={`translate(0 ${offset})`}>
        <text fill={theme.background.accent} fontSize={minDimension * 0.021} fontWeight="800" letterSpacing={minDimension * 0.004} x={contentX} y={contentY - minDimension * 0.11}>
          DATA STORY · {project.video.mode.replace("-", " ").toUpperCase()}
        </text>
        {lines.map((line, index) => (
          <text
            fill={theme.text.primary}
            fontSize={titleSize}
            fontWeight="820"
            key={`${line}-${index}`}
            letterSpacing={-titleSize * 0.045}
            x={contentX}
            y={contentY + index * titleSize * 1.02}
          >
            {line}
          </text>
        ))}
        <rect fill={theme.background.accent} height={minDimension * 0.009} rx={5} width={minDimension * 0.15} x={contentX} y={contentY + lines.length * titleSize * 1.08} />
        <text fill={theme.text.secondary} fontSize={minDimension * 0.031} fontWeight="560" x={contentX} y={contentY + lines.length * titleSize * 1.08 + minDimension * 0.075}>
          {scene.config.subtitle}
        </text>
        <g transform={`translate(${contentX} ${height * (portrait ? 0.72 : 0.74)})`}>
          <rect fill={theme.chrome.panel} height={minDimension * 0.11} rx={minDimension * 0.025} stroke={theme.chrome.grid} width={Math.min(width - contentX - project.video.safeArea.right, minDimension * 0.82)} />
          <circle cx={minDimension * 0.055} cy={minDimension * 0.055} fill={theme.background.accent} r={minDimension * 0.016} />
          <text dominantBaseline="central" fill={theme.text.primary} fontSize={minDimension * 0.024} fontWeight="650" x={minDimension * 0.1} y={minDimension * 0.055}>
            {scene.config.hookText}
          </text>
        </g>
      </g>
    </svg>
  );
}
