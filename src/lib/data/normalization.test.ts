import { describe, expect, it } from "vitest";
import { normalizeDataset } from "@/lib/data/normalization";

describe("normalizeDataset", () => {
  it("sorts periods and sums duplicate entity rows", () => {
    const result = normalizeDataset(
      [
        { year: "2021", company: "Acme", value: "12" },
        { year: "2020", company: "Acme", value: "5" },
        { year: "2020", company: "Acme", value: "7" },
      ],
      { time: "year", category: "company", value: "value" },
    );

    expect(result.dataset?.periods.map((period) => period.label)).toEqual(["2020", "2021"]);
    expect(result.dataset?.periods[0].points.acme.value).toBe(12);
    expect(result.issues.some((issue) => issue.code === "data.duplicate")).toBe(true);
  });

  it("returns actionable invalid-value errors", () => {
    const result = normalizeDataset(
      [{ year: "2020", company: "Acme", value: "not-a-number" }],
      { time: "year", category: "company", value: "value" },
    );

    expect(result.dataset).toBeNull();
    expect(result.issues[0]).toMatchObject({ code: "data.invalid_value", row: 2, column: "value" });
  });
});
