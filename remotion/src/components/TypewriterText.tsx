import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export const TypewriterText: React.FC<{
  text?: string;
  typingSpeedFrames?: number;
  holdDurationFrames?: number;
  eraseSpeedFrames?: number;
  extraHoldFrames?: number;
  textColor?: string;
  fontSize?: number;
  frame?: number;
}> = ({
  text = "Your amazing text here!",
  typingSpeedFrames = 2,
  holdDurationFrames = 60,
  eraseSpeedFrames = 1,
  extraHoldFrames = 0,
  textColor = "black",
  fontSize = 80,
  frame: frameProp,
}) => {
  const frame = frameProp !== undefined ? frameProp : useCurrentFrame();
  const totalHold = holdDurationFrames + extraHoldFrames;

  const textLength = text.length;
  const typingDuration = textLength * typingSpeedFrames;
  const eraseDuration = textLength * eraseSpeedFrames;

  const totalDuration = typingDuration + totalHold + eraseDuration;

  let visibleCharacters = 0;
  let opacity = 1;

  if (frame < typingDuration) {
    visibleCharacters = interpolate(frame, [0, typingDuration], [0, textLength], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    });
  } else if (frame < typingDuration + totalHold) {
    visibleCharacters = textLength;
  } else if (frame < totalDuration) {
    const eraseFrame = frame - (typingDuration + totalHold);
    visibleCharacters = interpolate(eraseFrame, [0, eraseDuration], [textLength, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    });
  } else {
    visibleCharacters = 0;
    opacity = 0;
  }

  const displayedText = text.slice(0, Math.floor(visibleCharacters));

  return (
    <AbsoluteFill style={{
      justifyContent: "center",
      alignItems: "center",
      opacity,
    }}>
      <h1 style={{
        fontFamily: "monospace",
        fontSize: `${fontSize}px`,
        color: textColor,
        textAlign: "center",
        whiteSpace: "pre-wrap",
      }}>
        {displayedText}
      </h1>
    </AbsoluteFill>
  );
};