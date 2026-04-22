import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import * as AllComponents from './index';
import templates from '../templates.json';
import { Camera, CameraMovement } from './Camera';

export type Position = 
  | 'left-top' | 'left-center' | 'left-bottom'
  | 'center-top' | 'center-center' | 'center-bottom'
  | 'right-top' | 'right-center' | 'right-bottom';

export interface Overlay {
  name: string;
  position?: Position;
  grid?: {
    index: number;
    total: number;
    columns: number;
  };
  startFrame: number;
  endFrame: number;
  constrained?: boolean;
  props?: Record<string, any>;
}

interface FVSequenceProps {
  sequence?: string[];
  overlays?: Overlay[];
  cameraMovements?: CameraMovement[];
  startOffset?: number;
}

export const calculateFVSequenceDuration = (props: FVSequenceProps) => {
  const sequence = props.sequence || [];
  const mainFrames = sequence.reduce((acc: number, name: string) => {
    const t = templates.find(temp => temp.name === name);
    return acc + (t?.durationInFrames || 0);
  }, 0);
  return Math.max(mainFrames, 30);
};

const getPositionStyle = (
  overlay: Overlay,
  videoWidth: number, 
  videoHeight: number
): React.CSSProperties => {
  const { position, constrained, grid } = overlay;
  const base: React.CSSProperties = { position: 'absolute' };
  
  // For grids, we now ignore the constrained flag to fill the full screen as requested
  const boxWidth = (constrained && !grid) ? videoWidth * 0.8 : videoWidth;
  const boxHeight = (constrained && !grid) ? videoHeight * 0.8 : videoHeight;
  
  const hPadding = (videoWidth - boxWidth) / 2;
  const vPadding = (videoHeight - boxHeight) / 2;

  if (grid) {
    const cols = grid.columns || 5;
    const rows = Math.ceil(grid.total / cols);
    const colIndex = grid.index % cols;
    const rowIndex = Math.floor(grid.index / cols);
    
    const cellWidth = boxWidth / cols;
    const cellHeight = boxHeight / rows;
    
    return {
      ...base,
      left: hPadding + colIndex * cellWidth + cellWidth / 2,
      top: vPadding + rowIndex * cellHeight + cellHeight / 2,
      transform: `translate(-50%, -50%)`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: cellWidth,
      height: cellHeight,
    };
  }

  const standardHPadding = constrained ? hPadding : 50;
  const standardVPadding = constrained ? vPadding : 50;

  switch (position) {
    case 'left-top': return { ...base, top: standardVPadding, left: standardHPadding };
    case 'left-center': return { ...base, top: '50%', left: standardHPadding, transform: 'translateY(-50%)' };
    case 'left-bottom': return { ...base, bottom: standardVPadding, left: standardHPadding };
    case 'center-top': return { ...base, top: standardVPadding, left: '50%', transform: 'translateX(-50%)' };
    case 'center-center': return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'center-bottom': return { ...base, bottom: standardVPadding, left: '50%', transform: 'translateX(-50%)' };
    case 'right-top': return { ...base, top: standardVPadding, right: standardHPadding };
    case 'right-center': return { ...base, top: '50%', right: standardHPadding, transform: 'translateY(-50%)' };
    case 'right-bottom': return { ...base, bottom: standardVPadding, right: standardHPadding };
    default: return base;
  }
};

export const FVSequence: React.FC<FVSequenceProps> = ({ 
  sequence = [], 
  overlays = [],
  cameraMovements = [],
  startOffset = 0
}) => {
  const frame = useCurrentFrame() + startOffset;
  const { width, height } = useVideoConfig();
  
  const activeSequence = sequence.length > 0 ? sequence : [templates[0].name];

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Camera movements={cameraMovements} frameOffset={frame}>
        {/* Background Sequence */}
        {(() => {
          let currentStart = 0;
          return activeSequence.map((name, index) => {
            const Component = (AllComponents as any)[name];
            const templateInfo = templates.find(t => t.name === name);
            if (!Component || !templateInfo) return null;
            
            const start = currentStart;
            const duration = templateInfo.durationInFrames;
            currentStart += duration;

            if (frame < start || frame >= start + duration) return null;

            return (
              <Sequence key={`bg-${index}`} from={start - startOffset} durationInFrames={duration}>
                <Component />
              </Sequence>
            );
          });
        })()}

        {/* Overlays */}
        {overlays.map((overlay, index) => {
          const Component = (AllComponents as any)[overlay.name];
          if (!Component) return null;
          
          const style = getPositionStyle(overlay, width, height);
          
          // Inject container dimensions into props for responsive components like Circles
          const componentProps = {
            ...(overlay.props || {}),
            containerWidth: style.width,
            containerHeight: style.height
          };
          
          return (
            <Sequence 
              key={`overlay-${index}`} 
              from={overlay.startFrame - startOffset} 
              durationInFrames={overlay.endFrame - overlay.startFrame}
            >
              <div style={style}>
                <Component {...componentProps} />
              </div>
            </Sequence>
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};