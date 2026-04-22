import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing, useVideoConfig } from 'remotion';

export interface CameraMovement {
  startFrame: number;
  endFrame: number;
  startZoom: number;
  endZoom: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CameraProps {
  movements: CameraMovement[];
  children: React.ReactNode;
  frameOffset?: number; // Added to support external timeline control
}

export const Camera: React.FC<CameraProps> = ({ movements, children, frameOffset }) => {
  const frame = frameOffset !== undefined ? frameOffset : useCurrentFrame();
  const { width, height } = useVideoConfig();

  const getCameraState = (f: number) => {
    const sortedMovements = [...movements].sort((a, b) => a.startFrame - b.startFrame);
    const activeMovement = sortedMovements.find(
      (m) => f >= m.startFrame && f <= m.endFrame
    );

    let zoom = 1;
    let x = 0;
    let y = 0;

    if (activeMovement) {
      const { startFrame, endFrame, startZoom, endZoom, startX, startY, endX, endY } = activeMovement;
      
      // Guard against zero-duration movements which cause interpolate to crash
      if (startFrame === endFrame) {
        return { zoom: endZoom, x: endX, y: endY };
      }

      const easing = Easing.inOut(Easing.quad);

      zoom = interpolate(f, [startFrame, endFrame], [startZoom, endZoom], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing,
      });

      x = interpolate(f, [startFrame, endFrame], [startX, endX], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing,
      });

      y = interpolate(f, [startFrame, endFrame], [startY, endY], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing,
      });
    } else {
      const lastFinishedMovement = [...sortedMovements]
        .reverse()
        .find((m) => f > m.endFrame);

      if (lastFinishedMovement) {
        zoom = lastFinishedMovement.endZoom;
        x = lastFinishedMovement.endX;
        y = lastFinishedMovement.endY;
      } else {
        const firstFutureMovement = sortedMovements.find((m) => f < m.startFrame);
        if (firstFutureMovement) {
          zoom = firstFutureMovement.startZoom;
          x = firstFutureMovement.startX;
          y = firstFutureMovement.startY;
        }
      }
    }

    return { zoom, x, y };
  };

  const current = getCameraState(frame);
  
  // Calculate velocity for motion blur
  const prev = getCameraState(frame - 0.5);
  const dx = Math.abs(current.x - prev.x);
  const dy = Math.abs(current.y - prev.y);
  const dz = Math.abs(current.zoom - prev.zoom) * 100;
  
  const velocity = Math.sqrt(dx * dx + dy * dy) + dz;
  const blurAmount = Math.min(velocity / 10, 15);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${current.zoom}) translate(${-current.x}px, ${-current.y}px)`,
        transformOrigin: 'center center',
        filter: blurAmount > 0.5 ? `blur(${blurAmount}px)` : 'none',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};