import { getTheme } from "@/themes";

export function SceneBackground({
  id,
  themeId,
  width,
  height,
  variant = "spotlight",
}: {
  id: string;
  themeId: string;
  width: number;
  height: number;
  variant?: "spotlight" | "gradient" | "solid";
}) {
  const theme = getTheme(themeId);
  return (
    <>
      <defs>
        <linearGradient id={`${id}-scene-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={theme.background.start} />
          <stop offset="100%" stopColor={theme.background.end} />
        </linearGradient>
        <radialGradient id={`${id}-scene-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.background.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={theme.background.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect fill={variant === "solid" ? theme.background.start : `url(#${id}-scene-bg)`} height={height} width={width} />
      {variant === "spotlight" && (
        <>
          <circle cx={width * 0.82} cy={height * 0.22} fill={`url(#${id}-scene-glow)`} r={Math.min(width, height) * 0.62} />
          <circle cx={width * 0.12} cy={height * 0.88} fill={`url(#${id}-scene-glow)`} opacity="0.45" r={Math.min(width, height) * 0.45} />
        </>
      )}
    </>
  );
}

export function splitSceneTitle(text: string, limit: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit && current) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}
