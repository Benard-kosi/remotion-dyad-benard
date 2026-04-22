"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  Play, Plus, Trash2, Save, Download, Terminal, Info, Copy, 
  Scissors, Film, ArrowRight, Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { FinalComposition } from "../../remotion/src/components/FinalComposition";
import templates from "../../remotion/src/templates.json";

const Final = () => {
  const [fvProject, setFvProject] = useState<any>(null);
  const [svProjects, setSvProjects] = useState<any[]>([]);
  const [cuts, setCuts] = useState<any[]>([]);
  
  // Form state
  const [selectedSvId, setSelectedSvId] = useState<string>("");
  const [cutStartTime, setCutStartTime] = useState<number>(0);

  useEffect(() => {
    const savedFv = localStorage.getItem('fv_project');
    const savedSv = localStorage.getItem('sv_projects');
    if (savedFv) setFvProject(JSON.parse(savedFv));
    if (savedSv) setSvProjects(JSON.parse(savedSv));
  }, []);

  const addCut = () => {
    const sv = svProjects.find(p => p.id === selectedSvId);
    if (!sv) {
      showError("Please select an SV video");
      return;
    }
    
    const newCut = {
      fvStartTime: cutStartTime,
      svVideo: sv
    };

    setCuts([...cuts, newCut].sort((a, b) => a.fvStartTime - b.fvStartTime));
    showSuccess("Cut added!");
  };

  const removeCut = (index: number) => {
    const newCuts = [...cuts];
    newCuts.splice(index, 1);
    setCuts(newCuts);
  };

  const totalFrames = useMemo(() => {
    if (!fvProject) return 30;
    
    const getDuration = (config: any) => {
      const mainFrames = config.sequence.reduce((acc: number, name: string) => {
        const t = templates.find((temp: any) => temp.name === name);
        return acc + (t?.durationInFrames || 0);
      }, 0);

      const ddFrames = config.cameraMovements.reduce((acc: number, move: any) => {
        if (move.deepDive) return acc + 90 + move.deepDive.durationInFrames;
        return acc;
      }, 0);

      return mainFrames + ddFrames;
    };

    const fvDuration = getDuration(fvProject);
    const svDuration = cuts.reduce((acc, cut) => acc + getDuration(cut.svVideo), 0);
    
    return fvDuration + svDuration;
  }, [fvProject, cuts]);

  const renderCommand = useMemo(() => {
    const props = JSON.stringify({ fvVideo: fvProject, cuts });
    const escapedProps = props.replace(/"/g, '\\"');
    return `npx remotion render remotion/src/index.ts FinalComposition final_video.mp4 --props="${escapedProps}" --duration=${totalFrames}`;
  }, [fvProject, cuts, totalFrames]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-amber-600 p-2 rounded-lg text-white">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Final Video Stitcher</h1>
            <p className="text-sm text-muted-foreground">Precisely cut SV templates into your main FV timeline.</p>
          </div>
        </div>
      </div>

      {!fvProject ? (
        <Card className="p-12 text-center">
          <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No FV Project Found</h2>
          <p className="text-muted-foreground mb-6">Go to the FV Creator and save a project first.</p>
          <Button asChild><Link to="/video-creator">Go to FV Creator</Link></Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Scissors className="h-4 w-4" /> Add SV Cut</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase">Select SV Video</label>
                  <Select value={selectedSvId} onValueChange={setSelectedSvId}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Choose SV project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {svProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase">Insert at FV Frame</label>
                  <Input 
                    type="number" 
                    value={cutStartTime} 
                    onChange={e => setCutStartTime(Number(e.target.value))} 
                    className="h-8" 
                  />
                  <p className="text-[9px] text-muted-foreground">The FV video will pause here, play the SV, then resume.</p>
                </div>
                <Button onClick={addCut} className="w-full h-8 text-xs" variant="secondary">
                  <Plus className="h-3 w-3 mr-2" /> Add Cut
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Active Cuts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {cuts.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No cuts added yet.</p>}
                {cuts.map((cut, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Frame {cut.fvStartTime}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{cut.svVideo.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCut(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5" /> Final Preview</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                    {totalFrames} frames
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 gap-2"><Download className="h-4 w-4" /> Render</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Export Final Video</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div className="bg-black rounded-lg p-4 relative">
                          <pre className="text-green-400 text-[10px] whitespace-pre-wrap break-all">
                            {renderCommand}
                          </pre>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute top-2 right-2 h-8 w-8 text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(renderCommand);
                              showSuccess("Copied!");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-black rounded-lg overflow-hidden relative mx-auto shadow-2xl"
                  style={{ aspectRatio: '16/9', width: '100%' }}
                >
                  <Player
                    key={JSON.stringify(cuts)}
                    component={FinalComposition}
                    inputProps={{ fvVideo: fvProject, cuts }}
                    durationInFrames={totalFrames}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: '100%', height: '100%' }}
                    controls
                    autoPlay
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Final;