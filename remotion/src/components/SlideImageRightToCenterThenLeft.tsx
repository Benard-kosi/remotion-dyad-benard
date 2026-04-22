import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Easing } from "remotion";
import placeholderImage from "../resources/placeholder.svg"; // Import the local placeholder image

export const SlideImageRightToCenterThenLeft: React.FC<{
  imageSrc?: string;
  entryDurationFrames?: number;
  holdDurationFrames?: number;
  exitDurationFrames?: number;
}> = ({
  imageSrc = placeholderImage, // Use the imported local placeholder as default
  entryDurationFrames = 30,
  holdDurationFrames = 30,
  exitDurationFrames = 12, // Reduced to 12 frames for a shorter exit
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();

  const imageWidth = 400; // Define a default width for the image
  const imageHeight = 250; // Define a default height for the image

  // Spring for the right-to-center movement (fast to slow)
  const enterProgress = spring({
    fps,
    frame,
    config: {
      damping: 20,
      stiffness: 100,
    },
    durationInFrames: entryDurationFrames,
  });

  let translateX = 0;
  let blur = 0;

  if (frame < entryDurationFrames) {
    // Phase 1: Right to Center (ease-out from spring)
    translateX = interpolate(enterProgress, [0, 1], [width / 2 + imageWidth / 2, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    blur = interpolate(enterProgress, [0, 1], [10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= (entryDurationFrames + holdDurationFrames)) {
    // Phase 3: Center to Left (slow start, then very fast zoom off with easeInExpo)
    const exitStartFrame = entryDurationFrames + holdDurationFrames;
    const exitEndFrame = exitStartFrame + exitDurationFrames;

    translateX = interpolate(frame, [exitStartFrame, exitEndFrame], [0, -(width / 2 + imageWidth / 2)], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.easeInExpo, // Easing.easeInExpo for a strong slow-then-fast exit
    });

    // Introduce a small delay before the blur starts
    const blurDelayFrames = 2; // Blur will start 2 frames into the exit animation
    blur = interpolate(frame, [exitStartFrame + blurDelayFrames, exitEndFrame], [0, 10], {
      extrapolateLeft: "clamp", // Ensures blur is 0 before the delayed start
      extrapolateRight: "clamp",
      easing: Easing.easeInExpo, // Easing.easeInExpo
    });
  }
  // Phase 2: Hold in Center (translateX and blur remain 0 by default)

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: imageWidth,
          height: imageHeight,
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          transform: `translateX(${translateX}px)`,
          filter: `blur(${blur}px)`,
        }}
      >
        <Img src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </AbsoluteFill>
  );
};