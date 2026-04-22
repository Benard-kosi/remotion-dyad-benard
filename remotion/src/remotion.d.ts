declare module 'remotion' {
  export interface CompositionProps<T = Record<string, unknown>> {
    id: string;
    component: React.ComponentType<T>;
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
    defaultProps?: T;
  }
}