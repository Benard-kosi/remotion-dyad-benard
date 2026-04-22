import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, interpolate, Easing } from "remotion";
import placeholderImage from "../resources/placeholder.svg";

export const FadeInImage: React.FC<{
  imageSrc?: string;
  fadeInDurationFrames?: number;
  holdDurationFrames?: number;
  fadeOutDurationFrames?: number;
  extraHoldFrames?: number;
  frame?: number;
}> = ({
  imageSrc = placeholderImage,
  fadeInDurationFrames = 15,
  holdDurationFrames = 30,
  fadeOutDurationFrames = 15,
  extraHoldFrames = 0,
  frame: frameProp,
}) => {
  const frame = frameProp !== undefined ? frameProp : useCurrentFrame();
  const totalHold = holdDurationFrames + extraHoldFrames;

  const opacity = interpolate(
    frame,
    [
      0,
      fadeInDurationFrames,
      fadeInDurationFrames + totalHold,
      fadeInDurationFrames + totalHold + fadeOutDurationFrames,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.easeOutCubic,
    }
  );

  return (
    <AbsoluteFill style={{
      justifyContent: "center",
      alignItems: "center",
      opacity,
    }}>
      <Img
        src={imageSrc}
        style={{
          maxWidth: "80%",
          maxHeight: "80%",
          objectFit: "contain",
          borderRadius: "10px",
        }}
      />
    </AbsoluteFill>
  );
};