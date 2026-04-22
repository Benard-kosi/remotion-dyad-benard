import React from 'react';
import { useCurrentFrame, interpolate, AbsoluteFill, Easing } from 'remotion';

export interface SubtitleItem {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface SubtitlesProps {
  items: SubtitleItem[];
  enabled?: boolean;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ items = [], enabled = true }) => {
  const frame = useCurrentFrame();

  if (!enabled || items.length === 0) return null;

  const currentSubtitle = items.find(
    (item) => frame >= item.startFrame && frame < item.endFrame
  );

  if (!currentSubtitle) return null;

  // Calculate a quick fade in/out for each subtitle block (5 frames)
  const fadeInOut = interpolate(
    frame,
    [
      currentSubtitle.startFrame, 
      currentSubtitle.startFrame + 5, 
      currentSubtitle.endFrame - 5, 
      currentSubtitle.endFrame
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad)
    }
  );

  return (
    <AbsoluteFill style={{
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: '80px', // Slightly higher for better visibility
      pointerEvents: 'none',
      opacity: fadeInOut,
      transform: `translateY(${interpolate(fadeInOut, [0, 1], [20, 0])}px)`, // Subtle slide up
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker for better contrast
        color: 'white',
        padding: '12px 30px',
        borderRadius: '16px',
        fontSize: '52px', // Slightly larger
        fontFamily: "'Bebas Neue', sans-serif",
        textAlign: 'center',
        maxWidth: '85%',
        lineHeight: '1.1',
        textTransform: 'uppercase',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '2px solid rgba(255,255,255,0.15)',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}>
        {currentSubtitle.text}
      </div>
    </AbsoluteFill>
  );
};