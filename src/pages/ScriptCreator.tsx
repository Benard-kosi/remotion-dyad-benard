"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { 
  Play, FileText, Terminal, Copy, Download, Info, 
  Sparkles, Wand2, Save, Trash2, ArrowRight, Eye, EyeOff, Grid3X3,
  Video, SaveAll, Loader2, Film, CloudUpload, AlertCircle, MessageSquare, Lightbulb,
  ArrowLeft, SaveIcon, Rocket
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { FinalComposition } from "../../remotion/src/components/FinalComposition";
import templates from "../../remotion/src/templates.json";

const EXAMPLE_SCRIPT = `SUBTITLES: ON
FV: WhiteBackground *4
FV: Batch Circles 3 3 0-180 "Naruto, Ichigo, Luffy" /main/naruto.png, /main/ichigo.png, /main/luffy.png
FV: Camera focus #1 30-60 2
FV: Camera focus #2 90-120 2
FV: Camera focus #3 150-180 2

FV: Overlay center-center 180-300 main constrained "The Big Three" FadeInTextTransition
FV: Camera focus [s] 180-300 1.5`;

const ScriptCreator = () => {
  const [script, setScript] = useState<string>("");
  const [svTemplates, setSvTemplates] = useState<any[]>([]);
  const [hudTemplates, setHudTemplates] = useState<any[]>([]);
  const [missingTemplates, setMissingTemplates] = useState<string[]>([]);
  const [hidePreview, setHidePreview] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  const fetchServerData = async () => {
    try {
      const [templatesRes, hudsRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/huds')
      ]);
      
      if (templatesRes.ok) setSvTemplates(await templatesRes.json());
      if (hudsRes.ok) setHudTemplates(await hudsRes.json());
    } catch (err) {
      console.error("Failed to fetch server data");
    }
  };

  useEffect(() => {
    fetchServerData();
    
    const pending = localStorage.getItem("pending_script");
    if (pending) {
      setScript(pending);
      localStorage.removeItem("pending_script");
      showSuccess("Loaded script from Magic Generator!");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const parsedData = useMemo(() => {
    const lines = script.split('\n').map(l => l.trim()).filter(l => l !== "");
    const width = 1920;
    const height = 1080;
    
    const fvVideo: any = { sequence: [], overlays: [], cameraMovements: [], subtitles: [], showSubtitles, huds: [], width, height };
    const internalSVs: Record<string, any> = {};
    const cuts: any[] = [];
    const missing: string[] = [];

    const getDuration = (config: any) => {
      return config.sequence.reduce((acc: number, name: string) => {
        const t = templates.find((temp: any) => temp.name === name);
        return acc + (t?.durationInFrames || 0);
      }, 0) || 0;
    };

    const addSubtitleChunks = (target: any, text: string, start: number, end: number, hudTemplate?: any) => {
      if (!text) return;
      const settings = hudTemplate?.subtitleSettings || { maxWordsPerChunk: 8, wordsPerSecond: 3 };
      const words = text.split(' ');
      if (words.length <= settings.maxWordsPerChunk) {
        target.subtitles.push({ text, startFrame: start, endFrame: end });
        return;
      }
      const totalFrames = end - start;
      const chunks = [];
      for (let i = 0; i < words.length; i += settings.maxWordsPerChunk) {
        chunks.push(words.slice(i, i + settings.maxWordsPerChunk).join(' '));
      }
      const framesPerChunk = Math.floor(totalFrames / chunks.length);
      chunks.forEach((chunk, i) => {
        target.subtitles.push({
          text: chunk,
          startFrame: start + (i * framesPerChunk),
          endFrame: i === chunks.length - 1 ? end : start + ((i + 1) * framesPerChunk)
        });
      });
    };

    lines.forEach(line => {
      if (line.startsWith('SUBTITLES:')) {
        const val = line.replace('SUBTITLES:', '').trim().toUpperCase();
        fvVideo.showSubtitles = val === 'ON';
        return;
      }
      if (line.startsWith('SUBTITLE:')) {
        const parts = line.match(/SUBTITLE: "([^"]*)" (\d+)-(\d+)/);
        if (parts) addSubtitleChunks(fvVideo, parts[1], parseInt(parts[2]), parseInt(parts[3]));
        return;
      }
      if (line.startsWith('HUD:')) {
        const parts = line.match(/HUD: (\w+) (#\w+)/);
        if (parts) {
          const hudTemplate = hudTemplates.find(h => h.name === parts[1]);
          if (hudTemplate) fvVideo.huds.push({ template: hudTemplate, tag: parts[2] });
        }
        return;
      }
      if (line.startsWith('SV_START:')) {
        const name = line.replace('SV_START:', '').trim();
        internalSVs[name] = { id: `sv-${Date.now()}-${name}`, name, sequence: [], overlays: [], cameraMovements: [], subtitles: [], width, height };
        return;
      }
      if (line.startsWith('FV: ') && !line.includes('Overlay') && !line.includes('Camera') && !line.includes('Batch')) {
        const content = line.replace('FV: ', '').trim();
        const match = content.match(/^(\w+)(?:\s*\*(\d+))?$/);
        if (match) {
          const name = match[1];
          const count = parseInt(match[2] || "1");
          if (templates.find(t => t.name === name)) {
            for (let i = 0; i < count; i++) fvVideo.sequence.push(name);
          }
        }
      }
      if (line.startsWith('FV: Batch')) {
        const parts = line.match(/FV: Batch (\w+) (\d+) (\d+) (\d+)-(\d+)(?:\s+(constrained))?\s+"([^"]*)"\s*(.*)/);
        if (parts) {
          const objectName = parts[1];
          const count = parseInt(parts[2]);
          const columns = parseInt(parts[3]);
          const startFrame = parseInt(parts[4]);
          const endFrame = parseInt(parts[5]);
          const isConstrained = parts[6] === 'constrained';
          const labels = parts[7].split(',').map(s => s.trim());
          const images = parts[8].split(',').map(s => s.trim());
          for (let i = 0; i < count; i++) {
            fvVideo.overlays.push({
              name: objectName,
              grid: { index: i, total: count, columns: columns },
              startFrame, endFrame, constrained: isConstrained,
              props: { label: labels[i] || "", imageSrc: images[i] || "/placeholder.png", sizeMode: 'keep' }
            });
          }
        }
      }
      if (line.startsWith('FV: Overlay')) {
        const parts = line.match(/FV: Overlay (?:\[(\w+)\] )?(\w+) ([\w-]+) (\d+)-(\d+)(?:\s+(main|small|keep))?(?:\s+(constrained))?(?:\s+\[(\w+)\])?\s+"([^"]*)"\s*(.*)/);
        if (parts) {
          const objectType = parts[2];
          let content = parts[10].trim();
          const startFrame = parseInt(parts[4]);
          const endFrame = parseInt(parts[5]);
          const label = parts[9];
          let tag = null;
          const tagMatch = content.match(/\s+(#\w+)$/);
          if (tagMatch) { tag = tagMatch[1]; content = content.replace(tagMatch[0], '').trim(); }
          const isTextComp = objectType.includes('Text') || objectType.includes('Transition');
          fvVideo.overlays.push({
            name: objectType, position: parts[3], startFrame, endFrame, constrained: parts[7] === 'constrained',
            props: { label, tag, text: isTextComp ? content : undefined, textContent: isTextComp ? content : undefined, imageSrc: (!isTextComp && objectType !== 'VideoObject' && objectType !== 'SequenceObject') ? content : undefined, videoSrc: objectType === 'VideoObject' ? content : undefined, sequence: objectType === 'SequenceObject' ? content.split(',').map(s => s.trim()) : undefined, sizeMode: parts[6] || 'keep' }
          });
          if (isTextComp) {
            const activeHud = fvVideo.huds.find((h: any) => h.tag === tag);
            addSubtitleChunks(fvVideo, content, startFrame, endFrame, activeHud?.template);
          }
        }
      }
      if (line.startsWith('FV: Camera focus')) {
        const parts = line.match(/FV: Camera focus (?:#(\d+)|\[(\w+)\]) (\d+)-(\d+) ([\d.]+)/);
        if (parts) {
          const targetIdx = parts[1] ? parseInt(parts[1]) - 1 : -1;
          fvVideo.cameraMovements.push({ startFrame: parseInt(parts[3]), endFrame: parseInt(parts[4]), startZoom: 1, endZoom: parseFloat(parts[5]), startX: 0, startY: 0, endX: 0, endY: 0, targetIdx });
        }
      }
      if (line.startsWith('CUT: ')) {
        const parts = line.match(/CUT: (.*) at (\d+)/);
        if (parts) {
          const sv = internalSVs[parts[1].trim()] || svTemplates.find(t => t.name === parts[1].trim() || String(t.number) === parts[1].trim());
          if (sv) cuts.push({ fvStartTime: parseInt(parts[2]), svVideo: sv });
        }
      }
      if (line.startsWith('CALL: ')) {
        const tagMatch = line.match(/\s+(#\w+)$/);
        const tag = tagMatch ? tagMatch[1] : null;
        const cleanLine = tag ? line.replace(tagMatch[0], '') : line;
        const parts = cleanLine.match(/CALL: (.*?) (?:at (\d+) )?(.*)/);
        if (parts) {
          const template = svTemplates.find(t => String(t.number) === parts[1].trim() || t.name === parts[1].trim());
          if (template) {
            const params = parts[3].trim().match(/(?:[^\s"]+|"[^"]*")+/g)?.map(p => p.replace(/"/g, '')) || [];
            let durationFrames = 0;
            const lastParam = params[params.length - 1];
            if (lastParam && (lastParam.endsWith('s') || !isNaN(Number(lastParam)))) {
              durationFrames = Math.floor(lastParam.endsWith('s') ? parseFloat(lastParam.slice(0, -1)) * 30 : Number(lastParam));
              params.pop();
            }
            let instantiated = JSON.parse(JSON.stringify(template));
            let tStr = JSON.stringify(instantiated);
            params.forEach((val, i) => { tStr = tStr.split(`{{${i + 1}}}`).join(val); });
            instantiated = JSON.parse(tStr);
            const originalTotal = getDuration(instantiated);
            if (durationFrames > 0) {
              const extra = durationFrames - originalTotal;
              const hinge = instantiated.stretchFrame || Math.floor(originalTotal / 2);
              instantiated.overlays = instantiated.overlays.map((obj: any) => {
                if (obj.endFrame <= hinge) return obj;
                if (obj.startFrame >= hinge) return { ...obj, startFrame: obj.startFrame + extra, endFrame: obj.endFrame + extra };
                const newObj = { ...obj, endFrame: obj.endFrame + extra };
                if (newObj.props) newObj.props.extraHoldFrames = (newObj.props.extraHoldFrames || 0) + extra;
                return newObj;
              });
              instantiated.cameraMovements = instantiated.cameraMovements.map((m: any) => {
                if (m.endFrame <= hinge) return m;
                if (m.startFrame >= hinge) return { ...m, startFrame: m.startFrame + extra, endFrame: m.endFrame + extra };
                return { ...m, endFrame: m.endFrame + extra };
              });
            }
            if (tag) {
              if (!internalSVs[tag]) internalSVs[tag] = { name: tag, sequence: [], overlays: [], cameraMovements: [], subtitles: [], width, height };
              const group = internalSVs[tag];
              const offset = getDuration(group);
              group.sequence.push(...instantiated.sequence);
              group.overlays.push(...instantiated.overlays.map((o: any) => ({ ...o, startFrame: o.startFrame + offset, endFrame: o.endFrame + offset })));
              group.cameraMovements.push(...instantiated.cameraMovements.map((m: any) => ({ ...m, startFrame: m.startFrame + offset, endFrame: m.endFrame + offset })));
            } else {
              cuts.push({ fvStartTime: parts[2] ? parseInt(parts[2]) : 0, svVideo: instantiated });
            }
          } else missing.push(parts[1].trim());
        }
      }
    });

    [fvVideo, ...Object.values(internalSVs)].forEach((target: any) => {
      let lastZoom = 1, lastX = 0, lastY = 0;
      target.cameraMovements.forEach((m: any) => {
        m.startZoom = lastZoom; m.startX = lastX; m.startY = lastY;
        if (m.targetIdx !== undefined && m.targetIdx >= 0) {
          const overlay = target.overlays[m.targetIdx];
          if (overlay) {
            let coords = { x: 0, y: 0 };
            if (overlay.position) {
              if (overlay.position.includes('left')) coords.x = -width/2 + (width * 0.1);
              if (overlay.position.includes('right')) coords.x = width/2 - (width * 0.1);
              if (overlay.position.includes('top')) coords.y = -height/2 + (height * 0.1);
              if (overlay.position.includes('bottom')) coords.y = height/2 - (height * 0.1);
            } else if (overlay.grid) {
              const boxW = overlay.constrained ? width * 0.8 : width, boxH = overlay.constrained ? height * 0.8 : height;
              const cols = overlay.grid.columns, rows = Math.ceil(overlay.grid.total / cols);
              coords.x = ((overlay.grid.index % cols) * (boxW / cols) + (boxW / cols) / 2) - boxW / 2;
              coords.y = (Math.floor(overlay.grid.index / cols) * (boxH / rows) + (boxH / rows) / 2) - boxH / 2;
            }
            m.endX = coords.x; m.endY = coords.y;
          }
        }
        lastZoom = m.endZoom; lastX = m.endX; lastY = m.endY;
      });
    });

    const totalFrames = Math.max(getDuration(fvVideo) + cuts.reduce((acc, cut) => acc + getDuration(cut.svVideo), 0), 30);
    return { fvVideo, cuts, internalSVs, missing, totalFrames };
  }, [script, svTemplates, hudTemplates, showSubtitles]);

  useEffect(() => { setMissingTemplates(parsedData.missing); }, [parsedData.missing]);

  const triggerRender = async () => {
    setIsRendering(true);
    try {
      const response = await fetch('/render-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, outputName: `manual_render_${Date.now()}` })
      });
      if (response.ok) showSuccess("Render started!");
      else showError("Failed to start render.");
    } catch (err) { showError("Network error."); } finally { setIsRendering(false); }
  };

  const renderCommand = useMemo(() => {
    const props = JSON.stringify({ fvVideo: parsedData.fvVideo, cuts: parsedData.cuts });
    return `npx remotion render remotion/src/index.ts FinalComposition output.mp4 --props="${props.replace(/"/g, '\\"')}" --duration=${parsedData.totalFrames}`;
  }, [parsedData]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Script Video Creator</h1>
            <p className="text-sm text-muted-foreground">Build videos using simple text commands.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setHidePreview(!hidePreview)} className="hidden sm:flex">
            {hidePreview ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {hidePreview ? "Show Preview" : "Hide Preview"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={hidePreview ? "lg:col-span-12 space-y-6" : "lg:col-span-5 space-y-6"}>
          <Card className="h-full flex flex-col border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" /> Video Script
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2 mr-2">
                  <Switch id="sub-toggle" checked={showSubtitles} onCheckedChange={setShowSubtitles} />
                  <Label htmlFor="sub-toggle" className="text-[10px] font-bold uppercase cursor-pointer">Subs</Label>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Scripting Guide</DialogTitle></DialogHeader>
                    <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                      <div><p className="font-bold">Subtitles</p><code className="text-xs bg-muted p-1 rounded block whitespace-pre">SUBTITLES: ON</code></div>
                      <div><p className="font-bold">Batch Grids</p><code className="text-xs bg-muted p-1 rounded block whitespace-pre">FV: Batch Circles 8 4 0-240 "L1, L2" /img1.png, /img2.png</code></div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-4">
              {script === "" ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 p-8 text-center space-y-4">
                  <Rocket className="h-12 w-12 text-purple-400 animate-bounce" />
                  <div className="space-y-1">
                    <h3 className="font-bold">Ready to create?</h3>
                    <p className="text-xs text-muted-foreground">Start typing your script or load an example to see how it works.</p>
                  </div>
                  <Button variant="secondary" className="gap-2" onClick={() => setScript(EXAMPLE_SCRIPT)}>
                    <Sparkles className="h-4 w-4" /> Load Example Script
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea 
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Write your script here..."
                    className="flex-1 font-mono text-xs min-h-[400px] resize-none bg-muted/30"
                  />
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button className="flex-1" variant="secondary" onClick={() => { fetchServerData(); showSuccess("Script parsed!"); }}>
                      <Sparkles className="h-4 w-4 mr-2" /> Update Preview
                    </Button>
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={triggerRender} disabled={isRendering}>
                      {isRendering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Film className="h-4 w-4 mr-2" />}
                      Render Video
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {!hidePreview && (
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-sm flex items-center gap-2"><Play className="h-4 w-4" /> Live Preview</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[10px] font-medium bg-muted px-2 py-1 rounded">{parsedData.totalFrames} frames</div>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" className="h-8 gap-2"><Download className="h-4 w-4" /> Export</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>Render Command</DialogTitle></DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div className="bg-black rounded-lg p-4 relative">
                          <pre className="text-green-400 text-[10px] whitespace-pre-wrap break-all">{renderCommand}</pre>
                          <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 text-white" onClick={() => { navigator.clipboard.writeText(renderCommand); showSuccess("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg overflow-hidden relative mx-auto shadow-2xl aspect-video w-full">
                  <Player key={script} component={FinalComposition} inputProps={{ fvVideo: parsedData.fvVideo, cuts: parsedData.cuts }} durationInFrames={parsedData.totalFrames} fps={30} compositionWidth={1920} compositionHeight={1080} style={{ width: '100%', height: '100%' }} controls autoPlay />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Parsed Structure</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {missingTemplates.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-destructive uppercase">Missing Templates</p>
                      <div className="flex flex-wrap gap-1 mt-1">{missingTemplates.map((m, i) => (<Badge key={i} variant="destructive" className="text-[8px] px-1 h-4">{m}</Badge>))}</div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">FV Sequence</p>
                  <div className="flex flex-wrap gap-2">{parsedData.fvVideo.sequence.map((s: string, i: number) => (<span key={i} className="text-[10px] bg-secondary px-2 py-1 rounded">{s}</span>))}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptCreator;