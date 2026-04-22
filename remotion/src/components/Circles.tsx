import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const Circles: React.FC<{
  imageSrc?: string;
  label?: string;
  containerWidth?: number;
  containerHeight?: number;
}> = ({ 
  imageSrc = "/placeholder.png", 
  label = "",
  containerWidth = 250,
  containerHeight = 250
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 120,
    },
  });

  const scale = interpolate(pulse, [0, 1], [0.5, 1]);
  const opacity = interpolate(pulse, [0, 1], [0, 1]);

  const finalSrc = imageSrc.startsWith('/') ? staticFile(imageSrc) : imageSrc;

  // Dynamic sizing based on container
  const minDim = Math.min(containerWidth, containerHeight);
  const circleSize = minDim * 0.75;
  const fontSize = Math.max(12, minDim * 0.12);

  const getLabelStyle = (text: string) => {
    const len = text.length;
    let adjustedFontSize = fontSize;
    
    // Further shrink font if text is very long
    if (len > 15) adjustedFontSize *= 0.85;
    if (len > 25) adjustedFontSize *= 0.75;

    return {
      fontSize: `${adjustedFontSize}px`,
      fontWeight: '900',
      color: 'black',
      textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 5px rgba(255, 255, 255, 0.5)',
      lineHeight: '0.95',
    };
  };

  const labelStyle = getLabelStyle(label);

  return (
    <div style={{
      position: 'relative',
      width: containerWidth,
      height: containerHeight,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${scale})`,
      opacity,
    }}>
      <div style={{
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        border: `${Math.max(2, minDim * 0.015)}px solid black`,
        backgroundColor: 'white',
        overflow: 'hidden',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25), 0 0 15px rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Img 
          key={finalSrc}
          src={finalSrc} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }} 
        />
      </div>

      {label && (
        <div style={{
          position: 'absolute',
          bottom: '5%',
          fontFamily: "'Bebas Neue', sans-serif",
          textAlign: 'center',
          width: '120%',
          zIndex: 10,
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          textTransform: 'uppercase',
          ...labelStyle
        }}>
          {label}
        </div>
      )}
    </div>
  );
};