import type {
  ColumnMapping,
  NormalizedDataPoint,
  NormalizedDataset,
  RawDataRow,
  RawDataValue,
  ValidationIssue,
} from "@/types/data";

export interface NormalizeResult {
  dataset: NormalizedDataset | null;
  issues: ValidationIssue[];
}

function parseNumber(value: RawDataValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(",", "").replaceAll("$", "").replaceAll("%", "");
  if (normalized === "") return null;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function parseTime(value: RawDataValue): { value: number; label: string } | null {
  const label = String(value ?? "").trim();
  if (!label) return null;
  const numeric = parseNumber(value);
  if (numeric !== null) return { value: numeric, label };
  const timestamp = Date.parse(label);
  return Number.isFinite(timestamp) ? { value: timestamp, label } : null;
}

function entityId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entity";
}

function optionalString(row: RawDataRow, column?: string): string | undefined {
  if (!column) return undefined;
  const value = row[column];
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || undefined;
}

export function normalizeDataset(rows: RawDataRow[], mapping: ColumnMapping): NormalizeResult {
  const issues: ValidationIssue[] = [];
  const requiredMappings: Array<[keyof ColumnMapping, string]> = [
    ["time", "Time"],
    ["category", "Category"],
    ["value", "Value"],
  ];

  for (const [key, label] of requiredMappings) {
    if (!mapping[key]) {
      issues.push({ code: "mapping.required", message: `${label} column is required.`, severity: "error" });
    }
  }

  if (issues.length > 0) return { dataset: null, issues };

  const pointByKey = new Map<string, NormalizedDataPoint>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const time = parseTime(row[mapping.time]);
    const categoryValue = String(row[mapping.category] ?? "").trim();
    const value = parseNumber(row[mapping.value]);

    if (!time) {
      issues.push({
        code: "data.invalid_time",
        message: `Row ${rowNumber} has an invalid time value.`,
        severity: "error",
        row: rowNumber,
        column: mapping.time,
        value: row[mapping.time],
      });
      return;
    }

    if (!categoryValue) {
      issues.push({
        code: "data.empty_category",
        message: `Row ${rowNumber} has an empty category.`,
        severity: "error",
        row: rowNumber,
        column: mapping.category,
        value: row[mapping.category],
      });
      return;
    }

    if (value === null) {
      issues.push({
        code: "data.invalid_value",
        message: `Row ${rowNumber} has an invalid numeric value.`,
        severity: "error",
        row: rowNumber,
        column: mapping.value,
        value: row[mapping.value],
      });
      return;
    }

    const id = entityId(categoryValue);
    const key = `${time.value}::${id}`;
    const existing = pointByKey.get(key);
    if (existing) {
      existing.value += value;
      existing.sourceRows.push(rowNumber);
      issues.push({
        code: "data.duplicate",
        message: `Duplicate ${time.label} / ${categoryValue} rows were summed.`,
        severity: "warning",
        row: rowNumber,
      });
      return;
    }

    pointByKey.set(key, {
      time: time.value,
      timeLabel: time.label,
      entityId: id,
      label: optionalString(row, mapping.displayLabel) ?? categoryValue,
      value,
      group: optionalString(row, mapping.group),
      color: optionalString(row, mapping.color),
      image: optionalString(row, mapping.image),
      secondaryMetric: mapping.secondaryMetric ? parseNumber(row[mapping.secondaryMetric]) ?? undefined : undefined,
      description: optionalString(row, mapping.description),
      sourceRows: [rowNumber],
    });
  });

  const points = Array.from(pointByKey.values()).sort((a, b) => a.time - b.time || b.value - a.value || a.label.localeCompare(b.label));
  if (points.length === 0) return { dataset: null, issues };

  const periodsByTime = new Map<number, { label: string; points: Record<string, NormalizedDataPoint> }>();
  const entities: NormalizedDataset["entities"] = {};

  for (const point of points) {
    const period = periodsByTime.get(point.time) ?? { label: point.timeLabel, points: {} };
    period.points[point.entityId] = point;
    periodsByTime.set(point.time, period);
    entities[point.entityId] ??= {
      id: point.entityId,
      label: point.label,
      group: point.group,
      color: point.color,
      image: point.image,
    };
  }

  const values = points.map((point) => point.value);
  return {
    dataset: {
      points,
      periods: Array.from(periodsByTime.entries())
        .sort(([a], [b]) => a - b)
        .map(([time, period]) => ({ time, ...period })),
      entities,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    },
    issues,
  };
}
