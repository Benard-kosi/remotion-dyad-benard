import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const AnimatedGridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Optional subtle animation
  const gridOpacity = interpolate(frame, [0, 30], [0.1, 0.15], {
    extrapolateRight: "clamp",
  });
  
  return (
    <AbsoluteFill style={{
      backgroundColor: 'white', // Restored white background
    }}>
      {/* Grid lines overlay */}
      <AbsoluteFill>
        {/* Horizontal lines */}
        {Array.from({length: Math.ceil(1080 / 38)}).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: i * 38,
              left: 0,
              width: '100%',
              height: '1px',
              backgroundColor: `rgba(0, 0, 0, ${gridOpacity})`,
            }}
          />
        ))}
        
        {/* Vertical lines */}
        {Array.from({length: Math.ceil(1920 / 38)}).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              left: i * 38,
              width: '1px',
              height: '100%',
              backgroundColor: `rgba(0, 0, 0, ${gridOpacity})`,
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};