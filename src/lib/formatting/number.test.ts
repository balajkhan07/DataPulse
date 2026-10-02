import { describe, expect, it } from "vitest";
import { formatValue } from "@/lib/formatting/number";

const base = { valuePrefix: "", valueSuffix: "", currency: "USD" };

describe("formatValue", () => {
  it("formats compact and currency values centrally", () => {
    expect(formatValue(1_250_000, { ...base, valueFormat: "compact" })).toBe("1.3M");
    expect(formatValue(1_250_000_000, { ...base, valueFormat: "currency" })).toBe("$1.3B");
  });

  it("applies custom affixes", () => {
    expect(formatValue(42, { ...base, valueFormat: "integer", valuePrefix: "≈", valueSuffix: " pts" })).toBe("≈42 pts");
  });
});
