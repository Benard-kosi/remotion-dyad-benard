import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from 'remotion';

export interface SubtitleSettings {
  maxWordsPerChunk: number;
  wordsPerSecond: number;
  fontSize?: number;
  bottomPadding?: number;
}

export interface HUDElement {
  type: 'text' | 'image' | 'progress';
  content?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  style?: React.CSSProperties;
  autoMap?: boolean;
}

export interface HUDTemplate {
  name: string;
  elements: HUDElement[];
  subtitleSettings?: SubtitleSettings; // Global settings for this HUD style
}

interface HUDProps {
  template?: HUDTemplate;
  topicLabel?: string;
  imageUrl?: string;
  groupDuration?: number;
}

export const HUD: React.FC<HUDProps> = ({ 
  template, 
  topicLabel = "Current Topic",
  imageUrl,
  groupDuration = 300 
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (!template) return null;

  const getPositionStyle = (pos: string): React.CSSProperties => {
    const padding = 40;
    switch (pos) {
      case 'top-left': return { top: padding, left: padding };
      case 'top-right': return { top: padding, right: padding };
      case 'bottom-left': return { bottom: padding, left: padding };
      case 'bottom-right': return { bottom: padding, right: padding };
      case 'top-center': return { top: padding, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center': return { bottom: padding, left: '50%', transform: 'translateX(-50%)' };
      default: return {};
    }
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
      {template.elements.map((el, i) => {
        const posStyle = getPositionStyle(el.position);
        const isAutoMap = el.autoMap !== false;
        
        if (el.type === 'text') {
          const text = isAutoMap 
            ? (el.content?.replace('{{topic}}', topicLabel) || topicLabel)
            : (el.content || "");
            
          return (
            <div key={i} style={{ position: 'absolute', ...posStyle, ...el.style }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '40px',
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '5px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                ...el.style
              }}>
                {text}
              </span>
            </div>
          );
        }

        if (el.type === 'image') {
          const src = (isAutoMap && imageUrl) ? imageUrl : (el.content || "/placeholder.png");
          const finalSrc = src.startsWith('/') ? staticFile(src) : src;
          return (
            <div key={i} style={{ 
              position: 'absolute', 
              ...posStyle,
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid white',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              backgroundColor: 'black',
              ...el.style 
            }}>
              <Img 
                src={finalSrc} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          );
        }

        if (el.type === 'progress') {
          const progress = interpolate(frame, [0, groupDuration], [0, 100], {
            extrapolateRight: 'clamp'
          });
          return (
            <div key={i} style={{ 
              position: 'absolute', 
              ...posStyle, 
              width: '40%', 
              height: '10px', 
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: '5px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              ...el.style 
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: 'white',
                boxShadow: '0 0 15px white',
                transition: 'width 0.1s linear'
              }} />
            </div>
          );
        }

        return null;
      })}
    </AbsoluteFill>
  );
};