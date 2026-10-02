import { parseProjectConfig, serializeProject } from "@/lib/project/schema";
import type { ProjectConfig } from "@/types/project";

export interface ProjectSummary {
  id: string;
  name: string;
  videoMode: ProjectConfig["video"]["mode"];
  updatedAt: string;
  createdAt: string;
}

export interface ProjectRepository {
  list(): ProjectSummary[];
  get(id: string): ProjectConfig | null;
  save(project: ProjectConfig): void;
  delete(id: string): void;
  getActiveId(): string | null;
  setActiveId(id: string): void;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PROJECT_INDEX_KEY = "datapulse.projects.v2";
const ACTIVE_PROJECT_KEY = "datapulse.active-project.v2";

export class LocalProjectRepository implements ProjectRepository {
  constructor(private readonly storage: StorageLike) {}

  private readProjects(): ProjectConfig[] {
    const serialized = this.storage.getItem(PROJECT_INDEX_KEY);
    if (!serialized) return [];
    try {
      const parsed: unknown = JSON.parse(serialized);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((candidate) => {
        try {
          return [parseProjectConfig(candidate)];
        } catch {
          return [];
        }
      });
    } catch {
      return [];
    }
  }

  list(): ProjectSummary[] {
    return this.readProjects()
      .map((project) => ({
        id: project.id,
        name: project.name,
        videoMode: project.video.mode,
        updatedAt: project.updatedAt,
        createdAt: project.createdAt,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): ProjectConfig | null {
    return this.readProjects().find((project) => project.id === id) ?? null;
  }

  save(project: ProjectConfig): void {
    const validated = parseProjectConfig(JSON.parse(serializeProject(project)));
    const projects = this.readProjects();
    const existingIndex = projects.findIndex((candidate) => candidate.id === validated.id);
    if (existingIndex >= 0) projects[existingIndex] = validated;
    else projects.push(validated);
    this.storage.setItem(PROJECT_INDEX_KEY, JSON.stringify(projects));
    this.setActiveId(project.id);
  }

  delete(id: string): void {
    this.storage.setItem(PROJECT_INDEX_KEY, JSON.stringify(this.readProjects().filter((project) => project.id !== id)));
    if (this.getActiveId() === id) this.storage.removeItem(ACTIVE_PROJECT_KEY);
  }

  getActiveId(): string | null {
    return this.storage.getItem(ACTIVE_PROJECT_KEY);
  }

  setActiveId(id: string): void {
    this.storage.setItem(ACTIVE_PROJECT_KEY, id);
  }
}

export function createBrowserProjectRepository(): ProjectRepository {
  return new LocalProjectRepository(window.localStorage);
}
