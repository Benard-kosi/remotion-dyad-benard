import React, { useEffect, useState } from 'react';
import { delayRender, continueRender } from 'remotion';
import { AutoTimeline } from './AutoTimeline';

export const RemotionRoot: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading Bebas Neue font'));

  useEffect(() => {
    // Wait for the Bebas Neue font to be loaded by the browser
    // This ensures it's available for the first frame of the render
    document.fonts.load('1em "Bebas Neue"').then(() => {
      continueRender(handle);
    }).catch((err) => {
      console.error('Font loading failed:', err);
      // Continue anyway so the render doesn't hang forever
      continueRender(handle);
    });
  }, [handle]);

  return <AutoTimeline />;
};