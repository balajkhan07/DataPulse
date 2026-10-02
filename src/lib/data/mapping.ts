import type { ColumnMapping, DatasetColumn } from "@/types/data";

const ROLE_HINTS = {
  time: ["year", "date", "time", "month", "period", "timestamp", "season", "quarter"],
  category: ["entity", "category", "company", "country", "name", "team", "player", "brand", "language", "product", "artist"],
  value: ["value", "amount", "total", "score", "revenue", "population", "users", "rank", "count", "marketcap", "market_cap"],
  displayLabel: ["label", "display", "display_name", "title"],
  group: ["group", "industry", "region", "type", "conference", "category_group"],
  color: ["color", "colour", "hex"],
  image: ["image", "image_url", "logo", "logo_url", "avatar", "flag"],
} as const;

function normalizedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function nameScore(name: string, hints: readonly string[]): number {
  const normalized = normalizedName(name);
  return hints.reduce((best, hint) => {
    const normalizedHint = normalizedName(hint);
    if (normalized === normalizedHint) return Math.max(best, 100);
    if (normalized.includes(normalizedHint)) return Math.max(best, 65);
    return best;
  }, 0);
}

function pickColumn(
  columns: DatasetColumn[],
  role: keyof typeof ROLE_HINTS,
  allowedTypes?: DatasetColumn["type"][],
  excluded: string[] = [],
): string | undefined {
  const ranked = columns
    .filter((column) => !excluded.includes(column.name))
    .map((column) => ({
      name: column.name,
      score: nameScore(column.name, ROLE_HINTS[role]) + (allowedTypes?.includes(column.type) ? 20 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].name : undefined;
}

export function suggestColumnMapping(columns: DatasetColumn[]): ColumnMapping {
  const time = pickColumn(columns, "time", ["number", "date"]) ?? columns.find((column) => column.type === "date")?.name ?? columns[0]?.name ?? "";
  const category = pickColumn(columns, "category", ["string"], [time]) ?? columns.find((column) => column.type === "string" && column.name !== time)?.name ?? "";
  const value = pickColumn(columns, "value", ["number"], [time, category]) ?? columns.find((column) => column.type === "number" && column.name !== time)?.name ?? "";

  return {
    time,
    category,
    value,
    displayLabel: pickColumn(columns, "displayLabel", ["string"], [time, category, value]),
    group: pickColumn(columns, "group", ["string"], [time, category, value]),
    color: pickColumn(columns, "color", ["string"], [time, category, value]),
    image: pickColumn(columns, "image", ["string"], [time, category, value]),
  };
}
