import { describe, expect, it } from "vitest";
import { createDefaultProject } from "@/lib/project/defaults";
import { LocalProjectRepository, type StorageLike } from "@/lib/project/repository";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("LocalProjectRepository", () => {
  it("saves, lists, loads, updates, and deletes projects", () => {
    const repository = new LocalProjectRepository(new MemoryStorage());
    const project = createDefaultProject();
    project.dataset.rows = [{ year: 2020, company: "Acme", value: 1 }];
    repository.save(project);
    expect(repository.list()).toHaveLength(1);
    expect(repository.get(project.id)?.dataset.rows).toEqual(project.dataset.rows);

    project.name = "Renamed";
    repository.save(project);
    expect(repository.get(project.id)?.name).toBe("Renamed");
    repository.delete(project.id);
    expect(repository.get(project.id)).toBeNull();
  });
});
