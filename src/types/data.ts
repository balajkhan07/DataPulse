export type RawDataValue = string | number | boolean | null;

export type RawDataRow = Record<string, RawDataValue>;

export type InferredColumnType = "number" | "date" | "boolean" | "string";

export interface DatasetColumn {
  name: string;
  type: InferredColumnType;
  nonEmptyCount: number;
  uniqueCount: number;
  examples: RawDataValue[];
}

export interface ColumnMapping {
  time: string;
  category: string;
  value: string;
  displayLabel?: string;
  group?: string;
  color?: string;
  image?: string;
  secondaryMetric?: string;
  description?: string;
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  row?: number;
  column?: string;
  value?: RawDataValue;
}

export interface NormalizedDataPoint {
  time: number;
  timeLabel: string;
  entityId: string;
  label: string;
  value: number;
  group?: string;
  color?: string;
  image?: string;
  secondaryMetric?: number;
  description?: string;
  sourceRows: number[];
}

export interface NormalizedEntity {
  id: string;
  label: string;
  group?: string;
  color?: string;
  image?: string;
}

export interface NormalizedPeriod {
  time: number;
  label: string;
  points: Record<string, NormalizedDataPoint>;
}

export interface NormalizedDataset {
  points: NormalizedDataPoint[];
  periods: NormalizedPeriod[];
  entities: Record<string, NormalizedEntity>;
  minValue: number;
  maxValue: number;
}

export type MissingValueStrategy = "zero" | "carry";

export interface ParseResult {
  rows: RawDataRow[];
  columns: DatasetColumn[];
  issues: ValidationIssue[];
}
