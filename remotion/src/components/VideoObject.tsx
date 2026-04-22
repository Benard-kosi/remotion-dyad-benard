import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Video, staticFile } from 'remotion';

export type SizeMode = 'main' | 'small' | 'keep';

export const VideoObject: React.FC<{
  videoSrc?: string;
  label?: string;
  sizeMode?: SizeMode;
}> = ({ 
  videoSrc = "", 
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

  const opacity = interpolate(intro, [0, 1], [0, 1]);
  const scaleIntro = interpolate(intro, [0, 1], [0.8, 1]);

  const finalSrc = videoSrc.startsWith('/') ? staticFile(videoSrc) : videoSrc;

  let heightVal: string | number = 'auto';

  if (sizeMode === 'main') {
    heightVal = videoHeight * 0.7;
  } else if (sizeMode === 'small') {
    heightVal = videoHeight * 0.7 * 0.4;
  }

  if (!videoSrc) return null;

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
      opacity,
      transform: `scale(${scaleIntro})`,
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Video 
          key={finalSrc}
          src={finalSrc} 
          style={{
            height: heightVal,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
          }} 
        />

        {label && (
          <div style={{
            position: 'absolute',
            top: '100%',
            marginTop: '15px',
            fontFamily: "'Bebas Neue', sans-serif",
            textAlign: 'center',
            width: '220%',
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
    </div>
  );
};