import type {
  DatasetColumn,
  InferredColumnType,
  ParseResult,
  RawDataRow,
  RawDataValue,
  ValidationIssue,
} from "@/types/data";

function isEmpty(value: RawDataValue): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function normalizeCell(value: unknown): RawDataValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return JSON.stringify(value);
}

function inferValueType(value: RawDataValue): InferredColumnType {
  if (typeof value === "number" && Number.isFinite(value)) return "number";
  if (typeof value === "boolean") return "boolean";

  const text = String(value).trim();
  if (text !== "" && Number.isFinite(Number(text.replaceAll(",", "")))) return "number";
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) && Number.isFinite(Date.parse(text))) return "date";
  return "string";
}

function inferColumnType(values: RawDataValue[]): InferredColumnType {
  const nonEmpty = values.filter((value) => !isEmpty(value));
  if (nonEmpty.length === 0) return "string";

  const counts = nonEmpty.reduce<Record<InferredColumnType, number>>(
    (result, value) => {
      result[inferValueType(value)] += 1;
      return result;
    },
    { number: 0, date: 0, boolean: 0, string: 0 },
  );

  const threshold = nonEmpty.length * 0.8;
  if (counts.number >= threshold) return "number";
  if (counts.date >= threshold) return "date";
  if (counts.boolean >= threshold) return "boolean";
  return "string";
}

export function inspectColumns(rows: RawDataRow[]): DatasetColumn[] {
  const names = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return names.map((name) => {
    const values = rows.map((row) => row[name] ?? null);
    const nonEmptyValues = values.filter((value) => !isEmpty(value));

    return {
      name,
      type: inferColumnType(values),
      nonEmptyCount: nonEmptyValues.length,
      uniqueCount: new Set(nonEmptyValues.map(String)).size,
      examples: nonEmptyValues.slice(0, 3),
    };
  });
}

function tokenizeCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  row.push(field.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export function parseCsv(input: string): ParseResult {
  const issues: ValidationIssue[] = [];
  const matrix = tokenizeCsv(input.replace(/^\uFEFF/, ""));

  if (matrix.length < 2) {
    return {
      rows: [],
      columns: [],
      issues: [{ code: "csv.empty", message: "CSV needs a header and at least one data row.", severity: "error" }],
    };
  }

  const headers = matrix[0].map((header, index) => header || `column_${index + 1}`);
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeaders.length > 0) {
    issues.push({
      code: "csv.duplicate_headers",
      message: `Duplicate column names: ${Array.from(new Set(duplicateHeaders)).join(", ")}.`,
      severity: "error",
    });
  }

  const rows = matrix.slice(1).map<RawDataRow>((values, rowIndex) => {
    if (values.length !== headers.length) {
      issues.push({
        code: "csv.column_count",
        message: `Row ${rowIndex + 2} has ${values.length} values; expected ${headers.length}.`,
        severity: "warning",
        row: rowIndex + 2,
      });
    }

    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null]));
  });

  return { rows, columns: inspectColumns(rows), issues };
}

export function parseJson(input: string): ParseResult {
  try {
    const parsed: unknown = JSON.parse(input);
    const sourceRows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { data?: unknown }).data)
        ? (parsed as { data: unknown[] }).data
        : null;

    if (!sourceRows) {
      return {
        rows: [],
        columns: [],
        issues: [{ code: "json.shape", message: "JSON must be an array of objects or an object with a data array.", severity: "error" }],
      };
    }

    const issues: ValidationIssue[] = [];
    const rows = sourceRows.flatMap<RawDataRow>((value, index) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        issues.push({
          code: "json.row_shape",
          message: `Item ${index + 1} is not an object and was skipped.`,
          severity: "warning",
          row: index + 1,
        });
        return [];
      }

      return [Object.fromEntries(Object.entries(value).map(([key, cell]) => [key, normalizeCell(cell)]))];
    });

    return { rows, columns: inspectColumns(rows), issues };
  } catch (error) {
    return {
      rows: [],
      columns: [],
      issues: [
        {
          code: "json.syntax",
          message: error instanceof Error ? error.message : "The JSON could not be parsed.",
          severity: "error",
        },
      ],
    };
  }
}

export function parseDataset(input: string, format: "csv" | "json"): ParseResult {
  return format === "json" ? parseJson(input) : parseCsv(input);
}
