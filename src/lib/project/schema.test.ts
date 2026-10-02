import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/lib/project/defaults";
import { projectConfigSchema } from "@/lib/project/schema";

describe("project config schema", () => {
  it("accepts the serializable default project", () => {
    expect(projectConfigSchema.safeParse(createDefaultProject()).success).toBe(true);
  });

  it("rejects unsupported schema versions", () => {
    expect(projectConfigSchema.safeParse({ ...createDefaultProject(), schemaVersion: 2 }).success).toBe(false);
  });
});
