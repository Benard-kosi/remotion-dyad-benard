import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { ArrowUp } from 'lucide-react';

export const ArrowSequence: React.FC<{
  direction?: string;
  extraHoldFrames?: number;
  frame?: number;
}> = ({ direction = 'up', extraHoldFrames = 0, frame: frameProp }) => {
  const frame = frameProp !== undefined ? frameProp : useCurrentFrame();
  const { fps } = useVideoConfig();

  const introDuration = 15;
  const baseHold = 30;
  const outroDuration = 15;
  const totalHold = baseHold + extraHoldFrames;

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
    durationInFrames: introDuration,
  });

  const outroSpring = spring({
    frame: frame - (introDuration + totalHold),
    fps,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: outroDuration,
  });

  let scale = interpolate(introSpring, [0, 1], [0, 1]);
  let opacity = interpolate(introSpring, [0, 1], [0, 1]);

  if (frame >= introDuration + totalHold) {
    scale = interpolate(outroSpring, [0, 1], [1, 0]);
    opacity = interpolate(outroSpring, [0, 1], [1, 0]);
  }

  const getRotation = (dir: string) => {
    switch (dir.toLowerCase()) {
      case 'right': return 90;
      case 'down': return 180;
      case 'left': return 270;
      case 'up-right': return 45;
      case 'down-right': return 135;
      case 'down-left': return 225;
      case 'up-left': return 315;
      default: return 0; // up
    }
  };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity }}>
      <div style={{
        transform: `scale(${scale}) rotate(${getRotation(direction)}deg)`,
        color: 'black',
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
        width: '80%',
        height: '80%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ArrowUp style={{ width: '100%', height: '100%' }} strokeWidth={3} />
      </div>
    </AbsoluteFill>
  );
};