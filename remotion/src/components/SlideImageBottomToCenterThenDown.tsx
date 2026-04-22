import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Easing } from "remotion";
import placeholderImage from "../resources/placeholder.svg";

export const SlideImageBottomToCenterThenDown: React.FC<{
  imageSrc?: string;
  entryDurationFrames?: number;
  holdDurationFrames?: number;
  exitDurationFrames?: number;
  extraHoldFrames?: number;
  frame?: number;
}> = ({
  imageSrc = placeholderImage,
  entryDurationFrames = 20,
  holdDurationFrames = 60,
  exitDurationFrames = 15,
  extraHoldFrames = 0,
  frame: frameProp,
}) => {
  const frame = frameProp !== undefined ? frameProp : useCurrentFrame();
  const { height, fps } = useVideoConfig();
  const totalHold = holdDurationFrames + extraHoldFrames;

  const imageHeight = 250;
  const imageWidth = 400;
  const offscreenBottomY = height / 2 + imageHeight / 2;

  const entryProgress = spring({
    fps,
    frame,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: entryDurationFrames,
  });

  const exitProgress = spring({
    fps,
    frame: frame - (entryDurationFrames + totalHold),
    config: { damping: 200, stiffness: 20 },
    durationInFrames: exitDurationFrames,
  });

  let translateY = 0;
  let blur = 0;

  if (frame < entryDurationFrames) {
    translateY = interpolate(entryProgress, [0, 1], [offscreenBottomY, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    blur = interpolate(entryProgress, [0, 1], [10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= entryDurationFrames && frame < (entryDurationFrames + totalHold)) {
    translateY = 0;
    blur = 0;
  } else if (frame >= (entryDurationFrames + totalHold)) {
    translateY = interpolate(exitProgress, [0, 1], [0, offscreenBottomY], {
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
          transform: `translateY(${translateY}px)`,
          filter: `blur(${blur}px)`,
        }}
      >
        <Img src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </AbsoluteFill>
  );
};