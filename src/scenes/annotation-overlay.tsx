import { getTheme } from "@/themes";
import type { VideoConfig } from "@/types/project";
import type { ScheduledAnnotation } from "@/types/story";

export function AnnotationOverlay({ annotation, frame, themeId, video }: { annotation: ScheduledAnnotation; frame: number; themeId: string; video: VideoConfig }) {
  const theme = getTheme(themeId);
  const progress = Math.max(0, Math.min(1, (frame - annotation.startFrame) / 10));
  const remaining = annotation.startFrame + annotation.durationFrames - frame;
  const opacity = Math.min(progress, Math.max(0, Math.min(1, remaining / 10)));
  const portrait = video.height > video.width;
  const minDimension = Math.min(video.width, video.height);
  const width = portrait ? video.width - video.safeArea.left - video.safeArea.right : video.width * 0.36;
  const height = minDimension * 0.12;
  const x = portrait ? video.safeArea.left : video.width - video.safeArea.right - width;
  const y = portrait ? video.safeArea.top + video.height * 0.105 : video.safeArea.top;

  return (
    <svg style={{ height: "100%", inset: 0, pointerEvents: "none", position: "absolute", width: "100%" }} viewBox={`0 0 ${video.width} ${video.height}`}>
      <g opacity={opacity} transform={`translate(0 ${(1 - progress) * -minDimension * 0.025})`}>
        <rect fill={theme.annotations.background} fillOpacity="0.92" height={height} rx={minDimension * 0.02} stroke={theme.annotations.border} strokeOpacity="0.55" strokeWidth={Math.max(2, minDimension * 0.003)} width={width} x={x} y={y} />
        <rect fill={theme.annotations.accent} height={height * 0.62} rx={3} width={minDimension * 0.008} x={x + minDimension * 0.026} y={y + height * 0.19} />
        <text fill={theme.text.primary} fontFamily={theme.fontFamily} fontSize={minDimension * 0.026} fontWeight="760" x={x + minDimension * 0.058} y={y + height * 0.45}>
          {annotation.title}
        </text>
        {annotation.description && (
          <text fill={theme.text.secondary} fontFamily={theme.fontFamily} fontSize={minDimension * 0.018} fontWeight="520" x={x + minDimension * 0.058} y={y + height * 0.72}>
            {annotation.description}
          </text>
        )}
      </g>
    </svg>
  );
}
