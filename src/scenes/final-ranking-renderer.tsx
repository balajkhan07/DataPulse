"use client";

import { useId } from "react";
import { EntityMark } from "@/components/visualization/entity-mark";
import { formatValue } from "@/lib/formatting/number";
import { getTheme } from "@/themes";
import { SceneBackground } from "@/scenes/scene-background";
import type { SceneRendererProps } from "@/scenes/types";
import { getFinalRanking } from "@/visualizations/bar-chart-race/final-ranking";

export function FinalRankingSceneRenderer({ project, dataset, scene, localFrame }: SceneRendererProps) {
  const id = useId().replaceAll(":", "");
  if (scene.type !== "final-ranking") return null;
  const { width, height } = project.video;
  const theme = getTheme(project.themeId);
  const portrait = height > width;
  const minDimension = Math.min(width, height);
  const ranking = getFinalRanking(dataset, project.visualization, project.video.fps, scene.config.topN);
  const contentLeft = project.video.safeArea.left;
  const contentRight = width - project.video.safeArea.right;
  const listTop = height * (portrait ? 0.26 : 0.25);
  const listBottom = height - project.video.safeArea.bottom;
  const rowHeight = (listBottom - listTop) / Math.max(1, ranking.length);
  const markSize = Math.min(rowHeight * 0.54, minDimension * 0.055);
  const fontSize = Math.min(rowHeight * 0.28, minDimension * 0.034);
  const titleSize = minDimension * (portrait ? 0.065 : 0.052);
  const revealFrames = Math.max(1, project.video.fps * 0.12);

  return (
    <svg aria-label={`${scene.config.title}, ${dataset.periods.at(-1)?.label ?? "final"}`} className="h-full w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
      <SceneBackground height={height} id={id} themeId={project.themeId} width={width} />
      <g fontFamily={theme.fontFamily}>
        <text fill={theme.background.accent} fontSize={minDimension * 0.019} fontWeight="800" letterSpacing={minDimension * 0.003} x={contentLeft} y={project.video.safeArea.top + minDimension * 0.035}>
          {dataset.periods.at(-1)?.label ?? "FINAL"}
        </text>
        <text fill={theme.text.primary} fontSize={titleSize} fontWeight="820" letterSpacing={-titleSize * 0.04} x={contentLeft} y={project.video.safeArea.top + titleSize * 1.32}>
          {scene.config.title}
        </text>
        <rect fill={theme.background.accent} height={minDimension * 0.007} rx={3} width={minDimension * 0.13} x={contentLeft} y={project.video.safeArea.top + titleSize * 1.65} />

        {ranking.map((item, index) => {
          const y = listTop + index * rowHeight;
          const reveal = Math.max(0, Math.min(1, (localFrame - index * revealFrames) / revealFrames));
          const color = item.color ?? theme.bars.palette[index % theme.bars.palette.length];
          const markX = contentLeft + minDimension * 0.075;
          const labelX = markX + (scene.config.showImages ? markSize + minDimension * 0.025 : 0);
          return (
            <g key={item.entityId} opacity={reveal} transform={`translate(${(1 - reveal) * minDimension * 0.035} 0)`}>
              <rect fill={theme.chrome.panel} height={rowHeight * 0.76} rx={minDimension * 0.018} stroke={theme.chrome.grid} width={contentRight - contentLeft} x={contentLeft} y={y} />
              <text dominantBaseline="central" fill={index < 3 ? theme.bars.topRank : theme.text.muted} fontSize={fontSize * 0.86} fontWeight="820" x={contentLeft + minDimension * 0.025} y={y + rowHeight * 0.38}>
                {String(index + 1).padStart(2, "0")}
              </text>
              {scene.config.showImages && (
                <EntityMark
                  color={color}
                  id={`${id}-final-${item.entityId}`}
                  image={item.image}
                  label={item.label}
                  size={markSize}
                  style={project.visualization.imageStyle}
                  textColor={theme.text.primary}
                  x={markX}
                  y={y + (rowHeight * 0.76 - markSize) / 2}
                />
              )}
              <text dominantBaseline="central" fill={theme.text.primary} fontSize={fontSize} fontWeight="700" x={labelX} y={y + rowHeight * 0.38}>
                {item.label}
              </text>
              {scene.config.showValues && (
                <text dominantBaseline="central" fill={theme.text.secondary} fontSize={fontSize * 0.84} fontWeight="650" textAnchor="end" x={contentRight - minDimension * 0.025} y={y + rowHeight * 0.38}>
                  {formatValue(item.value, project.visualization)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
