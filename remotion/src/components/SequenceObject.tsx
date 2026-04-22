import React from 'react';
import { Series, AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import * as AllComponents from './index';
import templates from '../templates.json';

export type SizeMode = 'main' | 'small' | 'keep';

export const SequenceObject: React.FC<{
  sequence?: string[];
  label?: string;
  sizeMode?: SizeMode;
}> = ({ 
  sequence = [], 
  label = "",
  sizeMode = 'keep'
}) => {
  const frame = useCurrentFrame();
  const { fps, height: videoHeight, width: videoWidth } = useVideoConfig();

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

  let heightVal: string | number = 300;
  let widthVal: string | number = 400;

  if (sizeMode === 'main') {
    heightVal = videoHeight * 0.7;
    widthVal = videoWidth * 0.7;
  } else if (sizeMode === 'small') {
    heightVal = videoHeight * 0.3;
    widthVal = videoWidth * 0.3;
  }

  const activeSequence = sequence.length > 0 ? sequence : [templates[0].name];

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
      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
    }}>
      <div style={{
        width: widthVal,
        height: heightVal,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        <AbsoluteFill>
          <Series>
            {activeSequence.map((item, index) => {
              const [name, data, extraHoldStr] = item.split('|');
              const Component = (AllComponents as any)[name];
              const templateInfo = templates.find(t => t.name === name);
              
              if (!Component || !templateInfo) return null;

              const extraHold = extraHoldStr ? parseInt(extraHoldStr) : 0;
              const totalDuration = templateInfo.durationInFrames + extraHold;

              const itemProps: any = {
                extraHoldFrames: extraHold,
                sizeMode
              };
              
              if (data) {
                if (name.includes('Text') || name.includes('Transition')) {
                  itemProps.text = data;
                  itemProps.textContent = data;
                } else if (name.includes('Image') || name === 'FadeInImage') {
                  itemProps.imageSrc = data;
                } else if (name === 'ArrowSequence') {
                  itemProps.direction = data;
                }
              }

              return (
                <Series.Sequence key={`${name}-${index}`} durationInFrames={totalDuration}>
                  <Component {...itemProps} />
                </Series.Sequence>
              );
            })}
          </Series>
        </AbsoluteFill>

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