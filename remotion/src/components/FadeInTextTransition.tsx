import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill, Easing } from "remotion";

export const FadeInTextTransition: React.FC<{
  text?: string;
  fadeInDurationFrames?: number;
  holdDurationFrames?: number;
  fadeOutDurationFrames?: number;
  extraHoldFrames?: number;
  frame?: number;
}> = ({
  text = "Your Text Here",
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
    [0, fadeInDurationFrames, fadeInDurationFrames + totalHold, fadeInDurationFrames + totalHold + fadeOutDurationFrames],
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
      <h1 style={{
        fontFamily: "sans-serif",
        fontSize: "80px",
        color: "black",
        textAlign: "center",
      }}>
        {text}
      </h1>
    </AbsoluteFill>
  );
};