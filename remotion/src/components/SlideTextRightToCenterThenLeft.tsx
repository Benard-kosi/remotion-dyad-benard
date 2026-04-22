import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

export const SlideTextRightToCenterThenLeft: React.FC<{
  textContent?: string;
  entryDurationFrames?: number;
  holdDurationFrames?: number;
  exitDurationFrames?: number;
}> = ({
  textContent = "Hello Remotion!",
  entryDurationFrames = 30,
  holdDurationFrames = 30,
  exitDurationFrames = 30, // Increased to 30 frames for a longer exit
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();

  // Spring for the right-to-center movement
  const enterProgress = spring({
    fps,
    frame,
    config: {
      damping: 20,
      stiffness: 100,
    },
    durationInFrames: entryDurationFrames,
  });

  // Spring for the center-to-left movement
  const exitProgress = spring({
    fps,
    frame: frame - (entryDurationFrames + holdDurationFrames),
    config: {
      damping: 20,
      stiffness: 100,
    },
    durationInFrames: exitDurationFrames,
  });

  let translateX = 0;
  let blur = 0;

  if (frame < entryDurationFrames) {
    // Phase 1: Right to Center (ease-out from spring)
    translateX = interpolate(enterProgress, [0, 1], [width, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    blur = interpolate(enterProgress, [0, 1], [10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= (entryDurationFrames + holdDurationFrames)) {
    // Phase 3: Center to Left (ease-in for exit)
    translateX = interpolate(exitProgress, [0, 1], [0, -width], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.easeInExpo,
    });
    blur = interpolate(exitProgress, [0, 1], [0, 10], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.easeInExpo,
    });
  }
  // Phase 2: Hold in Center (translateX and blur remain 0 by default)

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          color: "white",
          fontSize: "100px",
          fontFamily: "sans-serif",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          transform: `translateX(${translateX}px)`,
          filter: `blur(${blur}px)`,
        }}
      >
        {textContent}
      </div>
    </AbsoluteFill>
  );
};