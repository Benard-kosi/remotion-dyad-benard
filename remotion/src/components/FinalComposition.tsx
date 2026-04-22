import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { FVSequence } from './FVSequence';
import { Subtitles, SubtitleItem } from './Subtitles';
import { HUD, HUDTemplate } from './HUD';
import templates from '../templates.json';

interface VideoConfig {
  sequence: string[];
  overlays: any[];
  cameraMovements: any[];
  subtitles?: SubtitleItem[];
  showSubtitles?: boolean;
  huds?: { template: HUDTemplate; tag: string }[];
  width: number;
  height: number;
}

interface Cut {
  fvStartTime: number;
  svVideo: VideoConfig;
}

interface FinalCompositionProps {
  fvVideo?: VideoConfig;
  cuts?: Cut[];
}

export const getVideoConfigDuration = (config: VideoConfig) => {
  if (!config || !config.sequence) return 0;
  
  const mainFrames = config.sequence.reduce((acc, name) => {
    const t = templates.find((temp: any) => temp.name === name);
    return acc + (t?.durationInFrames || 0);
  }, 0);

  return mainFrames;
};

export const calculateFinalDuration = (props: FinalCompositionProps) => {
  if (!props.fvVideo) return 30;
  
  const fvTotalDuration = getVideoConfigDuration(props.fvVideo);
  let totalSvDuration = 0;
  
  props.cuts?.forEach(cut => {
    totalSvDuration += getVideoConfigDuration(cut.svVideo);
  });
  
  return fvTotalDuration + totalSvDuration;
};

export const FinalComposition: React.FC<FinalCompositionProps> = ({ 
  fvVideo, 
  cuts = [] 
}) => {
  if (!fvVideo) return <AbsoluteFill style={{ backgroundColor: 'black' }} />;

  const sortedCuts = [...cuts].sort((a, b) => a.fvStartTime - b.fvStartTime);
  
  const bgSegments: { from: number; duration: number; startOffset: number }[] = [];
  let currentFvFrame = 0;
  let currentTimelineFrame = 0;

  sortedCuts.forEach((cut, i) => {
    const segmentDuration = cut.fvStartTime - currentFvFrame;
    if (segmentDuration > 0) {
      bgSegments.push({
        from: currentTimelineFrame,
        duration: segmentDuration,
        startOffset: currentFvFrame
      });
      currentTimelineFrame += segmentDuration;
      currentFvFrame += segmentDuration;
    }

    const svDuration = getVideoConfigDuration(cut.svVideo);
    currentTimelineFrame += svDuration;
  });

  const fvTotalDuration = getVideoConfigDuration(fvVideo);
  const finalSegmentDuration = fvTotalDuration - currentFvFrame;
  if (finalSegmentDuration > 0) {
    bgSegments.push({
      from: currentTimelineFrame,
      duration: finalSegmentDuration,
      startOffset: currentFvFrame
    });
  }

  const allSubtitles: SubtitleItem[] = [];
  if (fvVideo.subtitles) {
    fvVideo.subtitles.forEach(sub => {
      const svDurationBefore = sortedCuts
        .filter(c => c.fvStartTime <= sub.startFrame)
        .reduce((acc, c) => acc + getVideoConfigDuration(c.svVideo), 0);
        
      allSubtitles.push({
        ...sub,
        startFrame: sub.startFrame + svDurationBefore,
        endFrame: sub.endFrame + svDurationBefore
      });
    });
  }

  let timelinePtr = 0;
  let fvPtr = 0;
  sortedCuts.forEach(cut => {
    const gap = cut.fvStartTime - fvPtr;
    timelinePtr += gap;
    fvPtr = cut.fvStartTime;
    
    if (cut.svVideo.subtitles) {
      cut.svVideo.subtitles.forEach(sub => {
        allSubtitles.push({
          ...sub,
          startFrame: sub.startFrame + timelinePtr,
          endFrame: sub.endFrame + timelinePtr
        });
      });
    }
    
    timelinePtr += getVideoConfigDuration(cut.svVideo);
  });

  // HUD Logic: Find start and end frames for each tag group
  const hudSegments: { template: HUDTemplate; from: number; duration: number; label: string; imageUrl?: string }[] = [];
  if (fvVideo.huds) {
    fvVideo.huds.forEach(hud => {
      const groupCuts = sortedCuts.filter(c => c.svVideo.name === hud.tag);
      if (groupCuts.length > 0) {
        const firstCut = groupCuts[0];
        const lastCut = groupCuts[groupCuts.length - 1];
        
        const svDurationBeforeFirst = sortedCuts
          .filter(c => c.fvStartTime < firstCut.fvStartTime)
          .reduce((acc, c) => acc + getVideoConfigDuration(c.svVideo), 0);
        
        const startTimelineFrame = firstCut.fvStartTime + svDurationBeforeFirst;
        
        const totalGroupDuration = groupCuts.reduce((acc, c) => acc + getVideoConfigDuration(c.svVideo), 0);
        const fvGapDuration = lastCut.fvStartTime - firstCut.fvStartTime;

        // --- DATA MAPPING LOGIC ---
        let label = hud.tag.replace('#', '').toUpperCase();
        let imageUrl = undefined;

        // 1. Try to find overlays with the exact tag (from FV: Overlay)
        const taggedOverlays = fvVideo.overlays.filter(o => o.props?.tag === hud.tag);
        const labelOverlay = taggedOverlays.find(o => o.props?.label && o.props.label.length > 0);
        const imageOverlay = taggedOverlays.find(o => o.props?.imageSrc);

        if (labelOverlay) label = labelOverlay.props.label;
        if (imageOverlay) imageUrl = imageOverlay.props.imageSrc;

        // 2. Fallback: Try to map to FV: Batch items based on the tag number (e.g. #topic1 -> index 0)
        const tagNumberMatch = hud.tag.match(/\d+/);
        if (tagNumberMatch && (!labelOverlay || !imageOverlay)) {
          const index = parseInt(tagNumberMatch[0]) - 1;
          const batchOverlay = fvVideo.overlays.find(o => o.grid && o.grid.index === index);
          if (batchOverlay) {
            if (!labelOverlay) label = batchOverlay.props?.label || label;
            if (!imageOverlay) imageUrl = batchOverlay.props?.imageSrc || imageUrl;
          }
        }
        
        hudSegments.push({
          template: hud.template,
          from: startTimelineFrame,
          duration: totalGroupDuration + fvGapDuration,
          label,
          imageUrl
        });
      }
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {bgSegments.map((seg, i) => (
        <Sequence 
          key={`bg-seg-${i}`} 
          from={seg.from} 
          durationInFrames={seg.duration}
        >
          <FVSequence {...fvVideo} startOffset={seg.startOffset} />
        </Sequence>
      ))}

      {(() => {
        let timelinePointer = 0;
        let fvPointer = 0;
        
        return sortedCuts.map((cut, i) => {
          const gap = cut.fvStartTime - fvPointer;
          timelinePointer += gap;
          fvPointer = cut.fvStartTime;
          
          const svDuration = getVideoConfigDuration(cut.svVideo);
          const startAt = timelinePointer;
          timelinePointer += svDuration;

          return (
            <Sequence 
              key={`cut-${i}-${cut.fvStartTime}`} 
              from={startAt} 
              durationInFrames={svDuration}
            >
              <FVSequence {...cut.svVideo} />
            </Sequence>
          );
        });
      })()}

      {/* HUD Layer - Rendered on top of video but below subtitles */}
      <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 50 }}>
        {hudSegments.map((seg, i) => (
          <Sequence key={`hud-${i}`} from={seg.from} durationInFrames={seg.duration}>
            <HUD template={seg.template} topicLabel={seg.label} imageUrl={seg.imageUrl} groupDuration={seg.duration} />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* Subtitles Layer - Always on top */}
      <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
        <Subtitles items={allSubtitles} enabled={fvVideo.showSubtitles} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};