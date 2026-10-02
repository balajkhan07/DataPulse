import type { BarChartRaceConfig } from "@/types/project";

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  const multiplier = 10 ** maximumFractionDigits;
  return String(Math.round(value * multiplier) / multiplier);
}

function formatInteger(value: number): string {
  const rounded = String(Math.round(Math.abs(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return value < 0 ? `-${rounded}` : rounded;
}

function formatCompact(value: number): string {
  const absolute = Math.abs(value);
  const compactUnits: Array<[number, string]> = [
    [1_000_000_000_000, "T"],
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  const unit = compactUnits.find(([threshold]) => absolute >= threshold);
  if (!unit) return formatDecimal(value, 1);
  return `${formatDecimal(value / unit[0], 1)}${unit[1]}`;
}

function currencySymbol(currency: string): string {
  return ({ USD: "$", EUR: "€", GBP: "£", JPY: "¥" } as Record<string, string>)[currency] ?? `${currency} `;
}

export function formatValue(value: number, config: Pick<BarChartRaceConfig, "valueFormat" | "valuePrefix" | "valueSuffix" | "currency">): string {
  let formatted: string;

  switch (config.valueFormat) {
    case "integer":
      formatted = formatInteger(value);
      break;
    case "compact":
      formatted = formatCompact(value);
      break;
    case "currency":
      formatted = `${currencySymbol(config.currency)}${formatCompact(value)}`;
      break;
    case "percentage":
      formatted = `${formatDecimal(value, 1)}%`;
      break;
    default:
      formatted = String(Math.round(value * 100) / 100);
  }

  return `${config.valuePrefix}${formatted}${config.valueSuffix}`;
}
