import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { getAudioTiming, getAudioVolume } from "@/lib/export/audio";
import { normalizeDataset } from "@/lib/data/normalization";
import { getTimelineDuration } from "@/lib/timeline/timeline";
import { StoryRenderer } from "@/scenes/story-renderer";
import type { ProjectConfig } from "@/types/project";

export type DataPulseCompositionProps = {
  project: ProjectConfig;
  audioSource: string | null;
};

export function DataPulseComposition({ project, audioSource }: DataPulseCompositionProps) {
  const frame = useCurrentFrame();
  const normalized = useMemo(
    () => normalizeDataset(project.dataset.rows, project.dataset.mapping).dataset,
    [project.dataset.mapping, project.dataset.rows],
  );
  const timelineFrames = getTimelineDuration(project.timeline);
  const audioTiming = getAudioTiming(project.audio, timelineFrames, project.video.fps);

  if (!normalized) {
    throw new Error("The dataset cannot be normalized for rendering. Check the mapped time, category, and value columns.");
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#090C14" }}>
      <StoryRenderer dataset={normalized} frame={frame} project={project} />
      {audioSource && audioTiming ? (
        <Sequence durationInFrames={audioTiming.outputDurationFrames} from={audioTiming.startFrame} layout="none">
          <Audio
            loop={audioTiming.loop}
            loopVolumeCurveBehavior="extend"
            src={staticFile(audioSource)}
            trimAfter={audioTiming.trimBeforeFrames + audioTiming.sourceDurationFrames}
            trimBefore={audioTiming.trimBeforeFrames}
            volume={(localFrame) => getAudioVolume(project.audio, localFrame, audioTiming.outputDurationFrames, project.video.fps)}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
}
