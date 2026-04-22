import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const RoundedRectangle: React.FC<{
  imageSrc?: string;
  label?: string;
  sizeMode?: 'main' | 'small' | 'keep';
}> = ({ 
  imageSrc = "/placeholder.png", 
  label = "",
  sizeMode = 'keep'
}) => {
  const frame = useCurrentFrame();
  const { fps, height: videoHeight } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 120,
    },
  });

  const scale = interpolate(intro, [0, 1], [0.5, 1]);
  const opacity = interpolate(intro, [0, 1], [0.1, 1]);

  const finalSrc = imageSrc.startsWith('/') ? staticFile(imageSrc) : imageSrc;

  let heightVal: string | number = 250;
  let widthVal: string | number = 350;

  if (sizeMode === 'main') {
    heightVal = videoHeight * 0.6;
    widthVal = heightVal * 1.4;
  } else if (sizeMode === 'small') {
    heightVal = 150;
    widthVal = 210;
  }

  const getLabelStyle = (text: string, isMain: boolean) => {
    const len = text.length;
    let fontSize = isMain ? 55 : 32;
    
    if (len > 20) fontSize *= 0.8;
    if (len > 40) fontSize *= 0.8;

    return {
      fontSize: `${fontSize}px`,
      fontWeight: '900',
      color: 'black',
      textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 5px rgba(255, 255, 255, 0.5)',
      lineHeight: '0.95',
    };
  };

  const labelStyle = getLabelStyle(label, sizeMode === 'main');

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${scale})`,
      opacity,
    }}>
      <div style={{
        width: widthVal,
        height: heightVal,
        borderRadius: '30px',
        border: '3px solid black',
        backgroundColor: 'white',
        overflow: 'hidden',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25), 0 0 15px rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
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
          top: '100%',
          marginTop: '12px',
          fontFamily: "'Bebas Neue', sans-serif",
          textAlign: 'center',
          width: '180%',
          left: '50%',
          transform: 'translateX(-50%)',
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