"use client";

import { useId } from "react";
import { applyEasing } from "@/lib/animation/easing";
import { SceneBackground, splitSceneTitle } from "@/scenes/scene-background";
import type { SceneRendererProps } from "@/scenes/types";
import { getTheme } from "@/themes";

export function TextSceneRenderer({ project, scene, localFrame }: SceneRendererProps) {
  const id = useId().replaceAll(":", "");
  if (scene.type !== "text") return null;
  const { width, height, safeArea } = project.video;
  const theme = getTheme(project.themeId);
  const minDimension = Math.min(width, height);
  const portrait = height > width;
  const progress = applyEasing(Math.min(1, localFrame / Math.max(1, project.video.fps * 0.65)), "easeOut");
  const titleSize = minDimension * (portrait ? 0.075 : 0.062);
  const bodySize = minDimension * (portrait ? 0.027 : 0.025);
  const titleLines = splitSceneTitle(scene.config.title, portrait ? 23 : 38);
  const bodyLines = splitSceneTitle(scene.config.body, portrait ? 45 : 70);
  const accent = scene.config.kind === "takeaway" ? theme.bars.topRank : theme.background.accent;
  const left = portrait ? safeArea.left : width * 0.16;
  const contentWidth = portrait ? width - safeArea.left - safeArea.right : width * 0.68;
  const top = height * (portrait ? 0.27 : 0.24);

  return (
    <svg aria-label={`${scene.config.eyebrow}: ${scene.config.title}`} role="img" style={{ height: "100%", width: "100%" }} viewBox={`0 0 ${width} ${height}`}>
      <SceneBackground height={height} id={id} themeId={project.themeId} variant={scene.config.kind === "insight" ? "spotlight" : "gradient"} width={width} />
      <g fontFamily={theme.fontFamily} opacity={progress} transform={`translate(0 ${(1 - progress) * minDimension * 0.055})`}>
        <text fill={accent} fontSize={minDimension * 0.019} fontWeight="820" letterSpacing={minDimension * 0.0035} x={left} y={top - minDimension * 0.07}>
          {scene.config.eyebrow.toUpperCase()}
        </text>
        {titleLines.map((line, index) => (
          <text fill={theme.text.primary} fontSize={titleSize} fontWeight="820" key={`${line}-${index}`} letterSpacing={-titleSize * 0.04} x={left} y={top + index * titleSize * 1.02}>
            {line}
          </text>
        ))}
        <rect fill={accent} height={minDimension * 0.008} rx={4} width={Math.min(contentWidth * 0.28, minDimension * 0.17)} x={left} y={top + titleLines.length * titleSize * 1.08} />
        {bodyLines.map((line, index) => (
          <text fill={theme.text.secondary} fontSize={bodySize} fontWeight="540" key={`${line}-${index}`} x={left} y={top + titleLines.length * titleSize * 1.08 + minDimension * 0.085 + index * bodySize * 1.5}>
            {line}
          </text>
        ))}
        <text fill={theme.text.muted} fontSize={minDimension * 0.016} fontWeight="700" letterSpacing={minDimension * 0.0025} x={left} y={height - safeArea.bottom * 0.65}>
          {project.content.source.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
