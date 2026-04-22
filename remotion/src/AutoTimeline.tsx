import { Composition } from 'remotion';
import templates from './templates.json';
import * as UserComponents from './components';
import { calculateFinalDuration } from './components/FinalComposition';
import { calculateFVSequenceDuration } from './components/FVSequence';

export const AutoTimeline: React.FC = () => {
  return (
    <>
      {templates.map((t) => {
        const Component = (UserComponents as any)[t.name];
        if (!Component) return null;

        // Handle FinalComposition with dynamic duration
        if (t.name === 'FinalComposition') {
          return (
            <Composition
              key={t.name}
              id={t.name}
              component={Component}
              fps={30}
              width={1920}
              height={1080}
              calculateMetadata={({ props }) => {
                return {
                  durationInFrames: calculateFinalDuration(props),
                };
              }}
            />
          );
        }

        // Handle FVSequence with dynamic duration
        if (t.name === 'FVSequence') {
          return (
            <Composition
              key={t.name}
              id={t.name}
              component={Component}
              fps={30}
              width={1920}
              height={1080}
              calculateMetadata={({ props }) => {
                return {
                  durationInFrames: calculateFVSequenceDuration(props),
                };
              }}
            />
          );
        }

        // Default static duration for other templates
        return (
          <Composition
            key={t.name}
            id={t.name}
            component={Component}
            durationInFrames={t.durationInFrames}
            fps={30}
            width={1920}
            height={1080}
          />
        );
      })}
    </>
  );
};