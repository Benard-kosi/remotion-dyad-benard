import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const TestBounceComp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const introDuration = 45; // Slightly longer for a better falling feel
  const holdDuration = 30;
  const outroDuration = 20;

  // Spring for the falling entrance
  // We use a lower damping to make it bounce more when it hits the "floor"
  const introSpring = spring({
    frame,
    fps,
    config: {
      damping: 8,
      stiffness: 120,
      mass: 1,
    },
    durationInFrames: introDuration,
  });

  // Spring for the exit (simple scale down)
  const outroSpring = spring({
    frame: frame - (introDuration + holdDuration),
    fps,
    config: {
      damping: 20,
      stiffness: 100,
    },
    durationInFrames: outroDuration,
  });

  let translateY = 0;
  let scale = 1;

  if (frame < introDuration) {
    // Fall from top (-height/2) to center (0)
    // The spring naturally overshoots, creating the bounce effect
    translateY = interpolate(introSpring, [0, 1], [-height / 2, 0]);
    
    // Subtle squash and stretch effect on impact
    // When introSpring > 1 (overshoot), we squash the text slightly
    const squash = interpolate(introSpring, [1, 1.1], [1, 0.8], {
      extrapolateRight: "clamp"
    });
    scale = squash;
  } else if (frame < introDuration + holdDuration) {
    translateY = 0;
    scale = 1;
  } else {
    // Bounce out / Scale down
    translateY = 0;
    scale = interpolate(outroSpring, [0, 1], [1, 0]);
  }

  return (
    <AbsoluteFill style={{ 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: 'transparent' 
    }}>
      <div style={{
        fontSize: 120,
        fontWeight: 'bold',
        color: 'white',
        transform: `translateY(${translateY}px) scaleY(${scale})`,
        fontFamily: 'sans-serif',
        textShadow: '0 10px 30px rgba(0,0,0,0.3)',
        transformOrigin: 'bottom', // Important for the "hitting the floor" look
      }}>
        Hello
      </div>
    </AbsoluteFill>
  );
};