import { describe, expect, it } from "vitest";
import { parseCsv, parseJson } from "@/lib/data/parsers";

describe("dataset parsers", () => {
  it("parses quoted CSV fields and infers column types", () => {
    const result = parseCsv('year,company,value\n2020,"Acme, Inc.","1,200"\n2021,Northwind,1500');

    expect(result.issues).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ year: "2020", company: "Acme, Inc.", value: "1,200" });
    expect(result.columns.find((column) => column.name === "value")?.type).toBe("number");
  });

  it("accepts JSON data envelopes and reports malformed rows", () => {
    const result = parseJson('{"data":[{"year":2020,"name":"A","value":4},"bad"]}');

    expect(result.rows).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("json.row_shape");
  });
});
