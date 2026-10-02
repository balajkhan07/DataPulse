"use client";

import { memo, useId, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { formatValue } from "@/lib/formatting/number";
import { getTheme } from "@/themes";
import type { BarChartRaceConfig } from "@/types/project";
import type { VisualizationRendererProps } from "@/types/visualization";
import { calculateBarChartLayout } from "@/visualizations/bar-chart-race/layout";
import type { BarChartRaceState } from "@/visualizations/bar-chart-race/types";

function truncateLabel(label: string, maximumCharacters: number): string {
  return label.length <= maximumCharacters ? label : `${label.slice(0, Math.max(1, maximumCharacters - 1))}…`;
}

function BarChartRaceRendererComponent({
  config,
  state,
  video,
  themeId,
  title,
  subtitle,
  source,
  footer,
}: VisualizationRendererProps<BarChartRaceConfig, BarChartRaceState>) {
  const theme = getTheme(themeId);
  const layout = useMemo(() => calculateBarChartLayout(video, config.topN), [video, config.topN]);
  const rawId = useId();
  const id = rawId.replaceAll(":", "");
  const valueReserve = Math.max(124, layout.valueSize * 5.8);
  const widthScale = scaleLinear()
    .domain([0, state.maxValue])
    .range([0, Math.max(40, layout.barMaxWidth - valueReserve)])
    .clamp(true);
  const maximumLabelCharacters = layout.portraitLabels ? 30 : 19;

  return (
    <svg
      aria-label={`${title} animated bar chart race at ${state.timeLabel}`}
      className="h-full w-full"
      role="img"
      viewBox={`0 0 ${video.width} ${video.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-background`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={theme.background.start} />
          <stop offset="100%" stopColor={theme.background.end} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.background.accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={theme.background.accent} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-chart-clip`}>
          <rect
            height={layout.chartHeight + layout.rowHeight * 0.5}
            width={video.width}
            x="0"
            y={layout.chartTop - layout.rowHeight * 0.18}
          />
        </clipPath>
      </defs>

      <rect fill={`url(#${id}-background)`} height={video.height} width={video.width} />
      <circle cx={video.width * 0.9} cy={video.height * 0.08} fill={`url(#${id}-glow)`} r={Math.min(video.width, video.height) * 0.5} />
      <circle cx={video.width * 0.08} cy={video.height * 0.86} fill={`url(#${id}-glow)`} opacity="0.45" r={Math.min(video.width, video.height) * 0.34} />

      <g fontFamily={theme.fontFamily}>
        <text
          fill={theme.text.primary}
          fontSize={layout.titleSize}
          fontWeight="760"
          letterSpacing={-layout.titleSize * 0.035}
          x={layout.contentLeft}
          y={layout.headerTop + layout.titleSize}
        >
          {truncateLabel(title, layout.portraitLabels ? 29 : 48)}
        </text>
        <rect
          fill={theme.background.accent}
          height={Math.max(5, layout.titleSize * 0.1)}
          rx={4}
          width={Math.min(video.width * 0.14, 145)}
          x={layout.contentLeft}
          y={layout.headerTop + layout.titleSize * 1.36}
        />
        <text
          fill={theme.text.secondary}
          fontSize={layout.subtitleSize}
          fontWeight="500"
          letterSpacing={layout.subtitleSize * 0.015}
          x={layout.contentLeft}
          y={layout.headerTop + layout.titleSize * 1.95}
        >
          {truncateLabel(subtitle, layout.portraitLabels ? 49 : 82)}
        </text>

        {Array.from({ length: 5 }).map((_, index) => {
          const x = layout.barStartX + (layout.barMaxWidth * index) / 4;
          return (
            <line
              key={x}
              stroke={theme.chrome.grid}
              strokeWidth={Math.max(1, video.width / 1600)}
              x1={x}
              x2={x}
              y1={layout.chartTop}
              y2={layout.chartTop + layout.chartHeight}
            />
          );
        })}

        <g clipPath={`url(#${id}-chart-clip)`}>
          {state.items.map((item) => {
            const rowY = layout.chartTop + item.position * layout.rowHeight;
            const barY = layout.portraitLabels
              ? layout.rowHeight * 0.39
              : (layout.rowHeight - layout.barHeight) / 2;
            const barWidth = widthScale(item.value);
            const color = item.color ?? theme.bars.palette[Math.abs(item.entityId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % theme.bars.palette.length];
            const imageSize = Math.min(layout.rowHeight * 0.46, Math.min(video.width, video.height) * 0.045);
            const labelX = layout.labelX + (config.showImages ? imageSize + layout.labelSize * 0.65 : 0);
            const valueX = Math.min(layout.contentRight, layout.barStartX + barWidth + layout.valueSize * 0.65);

            return (
              <g
                key={item.entityId}
                opacity={item.opacity * config.barOpacity}
                transform={`translate(0 ${rowY})`}
              >
                <text
                  fill={item.rank <= 3 ? theme.bars.topRank : theme.text.muted}
                  fontSize={layout.labelSize * 0.84}
                  fontWeight="750"
                  x={layout.rankX}
                  y={layout.portraitLabels ? layout.labelSize : layout.rowHeight * 0.58}
                >
                  {config.showRank ? String(item.rank).padStart(2, "0") : ""}
                </text>

                {config.showImages && (
                  item.image ? (
                    <image
                      clipPath={`circle(${imageSize / 2}px at ${imageSize / 2}px ${imageSize / 2}px)`}
                      height={imageSize}
                      href={item.image}
                      preserveAspectRatio="xMidYMid slice"
                      width={imageSize}
                      x={layout.labelX}
                      y={layout.portraitLabels ? 0 : (layout.rowHeight - imageSize) / 2}
                    />
                  ) : (
                    <g transform={`translate(${layout.labelX} ${layout.portraitLabels ? 0 : (layout.rowHeight - imageSize) / 2})`}>
                      <circle cx={imageSize / 2} cy={imageSize / 2} fill={color} opacity="0.2" r={imageSize / 2} />
                      <text
                        dominantBaseline="central"
                        fill={theme.text.primary}
                        fontSize={imageSize * 0.42}
                        fontWeight="800"
                        textAnchor="middle"
                        x={imageSize / 2}
                        y={imageSize / 2}
                      >
                        {item.label.slice(0, 1).toUpperCase()}
                      </text>
                    </g>
                  )
                )}

                <text
                  dominantBaseline={layout.portraitLabels ? undefined : "central"}
                  fill={theme.text.primary}
                  fontSize={layout.labelSize}
                  fontWeight="680"
                  letterSpacing={-layout.labelSize * 0.012}
                  x={labelX}
                  y={layout.portraitLabels ? layout.labelSize : layout.rowHeight / 2}
                >
                  {truncateLabel(item.label, maximumLabelCharacters)}
                </text>

                <rect
                  fill={theme.bars.track}
                  height={layout.barHeight}
                  rx={Math.min(config.barRadius, layout.barHeight / 2)}
                  width={layout.barMaxWidth - valueReserve}
                  x={layout.barStartX}
                  y={barY}
                />
                <rect
                  fill={color}
                  height={layout.barHeight}
                  rx={Math.min(config.barRadius, layout.barHeight / 2)}
                  width={Math.max(item.value > 0 ? 4 : 0, barWidth)}
                  x={layout.barStartX}
                  y={barY}
                />
                {item.rank <= 3 && (
                  <rect
                    fill="none"
                    height={layout.barHeight}
                    opacity="0.35"
                    rx={Math.min(config.barRadius, layout.barHeight / 2)}
                    stroke={theme.text.primary}
                    strokeWidth={Math.max(1, video.width / 900)}
                    width={Math.max(item.value > 0 ? 4 : 0, barWidth)}
                    x={layout.barStartX}
                    y={barY}
                  />
                )}
                {config.showValues && (
                  <text
                    dominantBaseline="central"
                    fill={theme.bars.value}
                    fontSize={layout.valueSize}
                    fontWeight="720"
                    textAnchor={valueX >= layout.contentRight - 2 ? "end" : "start"}
                    x={valueX}
                    y={barY + layout.barHeight / 2}
                  >
                    {formatValue(item.value, config)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <text
          fill={theme.text.primary}
          fontSize={layout.timeSize}
          fontWeight="820"
          letterSpacing={-layout.timeSize * 0.045}
          textAnchor="end"
          x={layout.contentRight}
          y={layout.timeY}
        >
          {state.timeLabel}
        </text>
        <text fill={theme.text.muted} fontSize={layout.sourceSize} fontWeight="520" x={layout.contentLeft} y={layout.timeY - layout.sourceSize * 0.25}>
          {truncateLabel(source, layout.portraitLabels ? 46 : 74)}
        </text>
        <text fill={theme.text.secondary} fontSize={layout.sourceSize} fontWeight="620" x={layout.contentLeft} y={layout.timeY + layout.sourceSize * 1.35}>
          {truncateLabel(footer, layout.portraitLabels ? 48 : 78)}
        </text>
      </g>
    </svg>
  );
}

export const BarChartRaceRenderer = memo(BarChartRaceRendererComponent);
