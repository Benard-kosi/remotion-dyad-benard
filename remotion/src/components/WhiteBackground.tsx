import React from 'react';
import { AbsoluteFill } from 'remotion';

export const WhiteBackground: React.FC = () => {
  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'white',
      // We make it 400% size and center it so that even when the camera 
      // moves to the extreme corners, there is still background visible.
      width: '400%',
      height: '400%',
      left: '-150%',
      top: '-150%',
    }} />
  );
};