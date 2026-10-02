import { resolveAssetReference } from "@/lib/assets/asset-reference";
import { staticFile } from "remotion";
import type { EntityImageStyle } from "@/types/project";

interface EntityMarkProps {
  id: string;
  x: number;
  y: number;
  size: number;
  label: string;
  color: string;
  textColor: string;
  image?: string;
  style: EntityImageStyle;
}

export function EntityMark({ id, x, y, size, label, color, textColor, image, style }: EntityMarkProps) {
  const clipId = `entity-mark-${id.replace(/[^a-z0-9_-]/gi, "-")}`;
  const radius = style === "circle" ? size / 2 : style === "rounded" ? size * 0.22 : 0;
  const reference = resolveAssetReference(image);
  const source = reference?.kind === "local" ? staticFile(reference.source) : reference?.source;

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <rect height={size} rx={radius} width={size} />
        </clipPath>
      </defs>
      <rect fill={color} height={size} opacity="0.22" rx={radius} width={size} />
      <text
        dominantBaseline="central"
        fill={textColor}
        fontSize={size * 0.42}
        fontWeight="800"
        textAnchor="middle"
        x={size / 2}
        y={size / 2}
      >
        {label.slice(0, 1).toUpperCase()}
      </text>
      {source && (
        <image
          clipPath={`url(#${clipId})`}
          height={size}
          href={source}
          preserveAspectRatio="xMidYMid meet"
          width={size}
        />
      )}
    </g>
  );
}
