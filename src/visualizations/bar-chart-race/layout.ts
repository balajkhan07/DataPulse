import type { SafeAreaConfig, VideoConfig } from "@/types/project";

export interface BarChartLayout {
  width: number;
  height: number;
  contentLeft: number;
  contentRight: number;
  headerTop: number;
  chartTop: number;
  chartHeight: number;
  rowHeight: number;
  barHeight: number;
  barStartX: number;
  barMaxWidth: number;
  labelX: number;
  rankX: number;
  timeY: number;
  titleSize: number;
  subtitleSize: number;
  labelSize: number;
  valueSize: number;
  timeSize: number;
  sourceSize: number;
  portraitLabels: boolean;
}

function scaleSafeArea(video: VideoConfig, safeArea: SafeAreaConfig): SafeAreaConfig {
  const scale = Math.min(video.width / 1080, video.height / 1080);
  return {
    top: safeArea.top * scale,
    right: safeArea.right * scale,
    bottom: safeArea.bottom * scale,
    left: safeArea.left * scale,
  };
}

export function calculateBarChartLayout(video: VideoConfig, topN: number): BarChartLayout {
  const { width, height } = video;
  const safe = scaleSafeArea(video, video.safeArea);
  const minDimension = Math.min(width, height);
  const portraitLabels = height / width >= 1.15;
  const headerHeight = portraitLabels ? height * 0.19 : height * 0.2;
  const footerHeight = portraitLabels ? height * 0.105 : height * 0.1;
  const chartTop = safe.top + headerHeight;
  const chartBottom = height - Math.max(safe.bottom, footerHeight);
  const chartHeight = Math.max(100, chartBottom - chartTop);
  const rowHeight = chartHeight / topN;
  const labelColumn = portraitLabels ? 0 : Math.min(width * 0.25, 410);
  const rankColumn = minDimension * 0.055;
  const imageColumn = minDimension * 0.06;
  const barStartX = safe.left + rankColumn + labelColumn + (portraitLabels ? 0 : imageColumn);
  const contentRight = width - safe.right;

  return {
    width,
    height,
    contentLeft: safe.left,
    contentRight,
    headerTop: safe.top,
    chartTop,
    chartHeight,
    rowHeight,
    barHeight: Math.max(10, rowHeight * (portraitLabels ? 0.42 : 0.58)),
    barStartX,
    barMaxWidth: Math.max(80, contentRight - barStartX),
    labelX: safe.left + rankColumn + (portraitLabels ? 0 : imageColumn),
    rankX: safe.left,
    timeY: height - Math.max(safe.bottom * 0.52, minDimension * 0.07),
    titleSize: Math.max(28, minDimension * (portraitLabels ? 0.062 : 0.052)),
    subtitleSize: Math.max(16, minDimension * 0.025),
    labelSize: Math.max(13, Math.min(rowHeight * 0.25, minDimension * 0.026)),
    valueSize: Math.max(13, Math.min(rowHeight * 0.24, minDimension * 0.023)),
    timeSize: Math.max(42, minDimension * (portraitLabels ? 0.13 : 0.1)),
    sourceSize: Math.max(12, minDimension * 0.018),
    portraitLabels,
  };
}
