import type { BarChartRaceConfig, VideoConfig, VideoMode } from "@/types/project";
import type { EventSettings, SceneType } from "@/types/story";

export interface SceneTemplateDefaults {
  type: SceneType;
  enabled: boolean;
  durationSeconds: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  themeId: string;
  videoMode: VideoMode;
  video: Pick<VideoConfig, "aspectRatio" | "fps" | "safeArea">;
  visualization: Partial<BarChartRaceConfig>;
  events: Partial<EventSettings>;
  scenes: SceneTemplateDefaults[];
}
