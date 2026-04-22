"use client";

import React, { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Film, Download, CheckCircle2, XCircle, 
  ChevronUp, ChevronDown, Activity, ExternalLink
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface RenderTask {
  id: string;
  name: string;
  status: 'rendering' | 'success' | 'failed';
  progress: number;
}

interface DownloadTask {
  id: string;
  url: string;
  progress: number;
  size: string;
  status: string;
  isYouTube: boolean;
}

const GlobalStatusBar = () => {
  const [renders, setRenders] = useState<RenderTask[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Refs to track previous states for notifications
  const prevRendersRef = useRef<RenderTask[]>([]);

  const fetchData = async () => {
    try {
      const [rendersRes, downloadsRes] = await Promise.all([
        fetch('/api/renders'),
        fetch('/api/active-downloads')
      ]);
      
      if (rendersRes.ok && downloadsRes.ok) {
        const currentRenders: RenderTask[] = await rendersRes.json();
        const currentDownloads: DownloadTask[] = await downloadsRes.json();

        // Check for render completions/failures
        currentRenders.forEach(render => {
          const prev = prevRendersRef.current.find(r => r.id === render.id);
          if (prev && prev.status === 'rendering') {
            if (render.status === 'success') {
              showSuccess(`Render Complete: ${render.name}`);
            } else if (render.status === 'failed') {
              showError(`Render Failed: ${render.name}`);
            }
          }
        });

        setRenders(currentRenders);
        setDownloads(currentDownloads);
        prevRendersRef.current = currentRenders;
      }
    } catch (err) {
      console.error("Status bar polling failed");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeRenders = renders.filter(r => r.status === 'rendering');
  const hasActivity = activeRenders.length > 0 || downloads.length > 0;

  if (!hasActivity && !isExpanded) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-0'}`}>
      {/* Toggle Button */}
      <div className="flex justify-center">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-primary text-primary-foreground px-4 py-1 rounded-t-lg shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          {hasActivity ? "System Activity" : "Status Bar"}
          {(activeRenders.length > 0 || downloads.length > 0) && (
            <div className="flex gap-1">
              {activeRenders.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-white/20 text-white border-none">
                  {activeRenders.length} Renders
                </Badge>
              )}
              {downloads.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-blue-500/40 text-white border-none">
                  {downloads.length} Downloads
                </Badge>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Main Bar */}
      <div className={`bg-background border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-6 py-3 ${isExpanded ? 'h-auto max-h-[400px] overflow-y-auto' : 'h-14'}`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          {/* Summary View (Always visible when not expanded) */}
          {!isExpanded && (
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-6 overflow-hidden">
                {activeRenders.length > 0 ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-primary">
                      <Film className="h-4 w-4 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase">Rendering</span>
                    </div>
                    <div className="w-32 sm:w-48">
                      <Progress value={activeRenders[0].progress} className="h-1.5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold">{activeRenders[0].progress}%</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px] hidden sm:inline">
                      {activeRenders[0].name}
                    </span>
                  </div>
                ) : downloads.length > 0 ? (
                  <div className="flex items-center gap-3 shrink-0 overflow-hidden">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[10px] font-bold uppercase">Downloading</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[300px] font-mono">
                      {downloads[0].url}
                    </span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 hidden sm:flex">{downloads[0].size}</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">System Idle</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 uppercase font-bold" asChild>
                  <Link to="/dashboard">
                    Dashboard <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
              {/* Renders Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Film className="h-3 w-3" /> Active Renders
                  </span>
                  <Badge variant="outline" className="text-[8px]">{activeRenders.length}</Badge>
                </div>
                {activeRenders.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No active renders.</p>
                ) : (
                  <div className="space-y-3">
                    {activeRenders.map(render => (
                      <div key={render.id} className="space-y-1.5 p-2 rounded bg-muted/30 border">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold truncate max-w-[200px]">{render.name}</span>
                          <span className="font-mono">{render.progress}%</span>
                        </div>
                        <Progress value={render.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Downloads Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Download className="h-3 w-3" /> Active Downloads
                  </span>
                  <Badge variant="outline" className="text-[8px]">{downloads.length}</Badge>
                </div>
                {downloads.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No active downloads.</p>
                ) : (
                  <div className="space-y-3">
                    {downloads.map(dl => (
                      <div key={dl.id} className="flex flex-col p-2 rounded bg-blue-50/50 border border-blue-100 gap-1.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
                          <span className="text-[10px] font-mono truncate flex-1">{dl.url}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px] h-4 px-1">{dl.isYouTube ? 'YOUTUBE' : 'DIRECT'}</Badge>
                            <span className="text-[9px] text-muted-foreground font-mono">Size: {dl.size}</span>
                          </div>
                          <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">{dl.status}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalStatusBar;