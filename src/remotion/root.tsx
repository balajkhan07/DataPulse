import { Composition } from "remotion";
import { createDefaultProject } from "@/lib/project/defaults";
import { getTimelineDuration } from "@/lib/timeline/timeline";
import { DataPulseComposition, type DataPulseCompositionProps } from "@/remotion/composition";

const defaultProject = createDefaultProject();
const defaultProps: Record<string, unknown> = { project: defaultProject, audioSource: null } satisfies DataPulseCompositionProps;

function SerializableComposition(props: Record<string, unknown>) {
  return <DataPulseComposition {...props as DataPulseCompositionProps} />;
}

export function RemotionRoot() {
  return (
    <Composition
      calculateMetadata={({ props }) => {
        const { project } = props as DataPulseCompositionProps;
        return {
          durationInFrames: getTimelineDuration(project.timeline),
          fps: project.video.fps,
          width: project.video.width,
          height: project.video.height,
          props,
        };
      }}
      component={SerializableComposition}
      defaultProps={defaultProps}
      durationInFrames={getTimelineDuration(defaultProject.timeline)}
      fps={defaultProject.video.fps}
      height={defaultProject.video.height}
      id="DataPulseStory"
      width={defaultProject.video.width}
    />
  );
}
