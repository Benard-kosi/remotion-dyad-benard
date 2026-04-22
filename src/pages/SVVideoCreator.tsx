"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Minus, Trash2, Play, Layers, Camera as CameraIcon, Eye, 
  RotateCcw, ZoomIn, ZoomOut, Settings2, Edit2, Check, 
  Box, Grid3X3, Download, Copy, Terminal, Info, FileVideo, Image as ImageIcon, Type,
  Zap, Maximize2, Minimize2, ChevronLeft, ArrowLeft, Save, FilePlus, Bookmark,
  CloudUpload, HardDrive, FolderOpen, Monitor, ShieldCheck, Sparkles, Link as LinkIcon,
  Pencil, Anchor, Clock, MessageSquare, Film
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import ImageSearch from "@/components/ImageSearch";

import templates from "../../remotion/src/templates.json";
import { FVSequence, Position, Overlay } from "../../remotion/src/components/FVSequence";
import { CameraMovement, Camera } from "../../remotion/src/components/Camera";

const UNIT_SIZE = 100; 
const GRID_RANGE = 5; 

const SlotPicker = ({ 
  value, 
  onChange, 
  maxSlots, 
  onIncrement, 
  onDecrement 
}: { 
  value: number | null, 
  onChange: (val: number | null) => void, 
  maxSlots: number, 
  onIncrement: () => void, 
  onDecrement: () => void 
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
    <div className="flex flex-wrap gap-1">
      <Button 
        variant={value === null ? "default" : "outline"} 
        size="icon" 
        className="h-5 w-8 text-[8px] font-bold"
        onClick={() => onChange(null)}
      >
        OFF
      </Button>
      {Array.from({ length: maxSlots }).map((_, i) => (
        <Button 
          key={i + 1} 
          variant={value === i + 1 ? "default" : "outline"} 
          size="icon" 
          className={`h-5 w-8 text-[8px] font-bold ${value === i + 1 ? "bg-blue-600" : "bg-primary/5 border-primary/20"}`}
          onClick={() => onChange(i + 1)}
        >
          {`{{${i + 1}}}`}
        </Button>
      ))}
    </div>
    <div className="flex gap-1 self-end sm:self-auto">
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onDecrement} disabled={maxSlots <= 1}>
        <Minus className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onIncrement}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

const SVVideoCreator = () => {
  const [hidePanels, setHidePanels] = useState(false);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [outputName, setOutputName] = useState("");
  const [templateNumber, setTemplateNumber] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [stretchFrame, setStretchFrame] = useState<number>(30);
  const [sequence, setSequence] = useState<string[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [cameraMovements, setCameraMovements] = useState<CameraMovement[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [maxSlots, setMaxSlots] = useState(5);

  const fetchServerTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setSavedTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch server templates");
    }
  };

  useEffect(() => {
    fetchServerTemplates();
  }, []);

  const resetProject = () => {
    setOutputName(""); setTemplateNumber(""); setTemplateDescription(""); setSequence([]); setOverlays([]); setCameraMovements([]); setRules([]);
    setStretchFrame(30);
    showSuccess("Started new project!");
  };

  const loadProject = (project: any) => {
    setOutputName(project.name || "");
    setTemplateNumber(project.number || "");
    setTemplateDescription(project.description || "");
    setStretchFrame(project.stretchFrame || 30);
    setSequence(project.sequence || []);
    
    const processedOverlays = (project.overlays || []).map((o: any) => {
      const props = { ...o.props };
      const mappings: any = {};
      ['imageSrc', 'videoSrc', 'direction', 'label', 'sequence'].forEach(key => {
        const val = props[key];
        if (typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')) {
          const slot = parseInt(val.replace('{{', '').replace('}}', ''));
          if (!isNaN(slot)) mappings[`${key}Slot`] = slot;
        }
      });
      return { ...o, props: { ...props, ...mappings } };
    });

    setOverlays(processedOverlays);
    setCameraMovements(project.cameraMovements || []);
    setRules(project.rules || []);
    setWidth(project.width || 1920);
    setHeight(project.height || 1080);
    showSuccess(`Loaded project: ${project.name}`);
  };

  const saveAsTemplate = async () => {
    if (!outputName) {
      showError("Please give your template a name first.");
      return;
    }

    const transformedOverlays = overlays.map(o => {
      const props = { ...o.props };
      if (props.imageSrcSlot) props.imageSrc = `{{${props.imageSrcSlot}}}`;
      if (props.videoSrcSlot) props.videoSrc = `{{${props.videoSrcSlot}}}`;
      if (props.directionSlot) props.direction = `{{${props.directionSlot}}}`;
      if (props.labelSlot) props.label = `{{${props.labelSlot}}}`;
      if (props.sequenceSlot) props.sequence = [`{{${props.sequenceSlot}}}`];
      
      const cleanProps = { ...props };
      delete cleanProps.imageSrcSlot; delete cleanProps.videoSrcSlot;
      delete cleanProps.directionSlot; delete cleanProps.labelSlot;
      delete cleanProps.sequenceSlot;
      
      return { ...o, props: cleanProps };
    });

    const template = { 
      id: `sv-template-${Date.now()}`, 
      name: outputName, 
      number: templateNumber,
      description: templateDescription,
      stretchFrame,
      sequence, overlays: transformedOverlays, cameraMovements, rules, width, height 
    };

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (res.ok) {
        showSuccess(`Saved as file: public/templates/${outputName.toLowerCase()}.json`);
        fetchServerTemplates();
      }
    } catch (err) {
      showError("Network error");
    }
  };

  const deleteTemplate = async (name: string) => {
    try {
      const res = await fetch(`/api/templates/${name}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("File deleted");
        fetchServerTemplates();
      }
    } catch (err) {
      showError("Failed to delete template");
    }
  };

  const addRule = (type: string) => {
    if (rules.find(r => r.type === type)) {
      showError("Rule already active.");
      return;
    }
    setRules([...rules, { type, id: Date.now() }]);
    showSuccess(`${type} rule added!`);
  };

  const removeRule = (id: number) => setRules(rules.filter(r => r.id !== id));

  const [editingObjIndex, setEditingObjIndex] = useState<number | null>(null);
  const [cameraTool, setCameraTool] = useState<"path" | "focus">("path");
  const [inputMethod, setInputMethod] = useState<"manual" | "visual">("visual");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].name);
  const [selectedObject, setSelectedObject] = useState<string>("Circles");
  const [selectedPosition, setSelectedPosition] = useState<Position>("center-center");
  const [selectedSizeMode, setSelectedSizeMode] = useState<string>("keep");
  const [referenceOverlayIndex, setReferenceOverlayIndex] = useState<string>("");
  const [objStartFrame, setObjStartFrame] = useState(0);
  const [objEndFrame, setObjEndFrame] = useState(60);
  const [objConstrained, setObjConstrained] = useState(false);
  const [objImage, setObjImage] = useState("/placeholder.png");
  const [objSequence, setObjSequence] = useState("");
  const [objLabel, setObjLabel] = useState("");
  const [objExtraHold, setObjExtraHold] = useState(0);
  
  const [imageSlot, setImageSlot] = useState<number | null>(null);
  const [labelSlot, setLabelSlot] = useState<number | null>(null);
  const [sequenceSlot, setSequenceSlot] = useState<number | null>(null);

  const [batchCount, setBatchCount] = useState(5);
  const [batchCols, setBatchCols] = useState(5);
  const [batchImages, setBatchImages] = useState("");
  const [batchLabels, setBatchLabels] = useState("");
  const [camStartFrame, setCamStartFrame] = useState(0);
  const [camEndFrame, setCamEndFrame] = useState(60);
  const [startZoom, setStartZoom] = useState(1);
  const [endZoom, setEndZoom] = useState(1);
  const [sLeft, setSLeft] = useState(0);
  const [sRight, setSRight] = useState(0);
  const [sUp, setSUp] = useState(0);
  const [sDown, setSDown] = useState(0);
  const [eLeft, setELeft] = useState(0);
  const [eRight, setERight] = useState(0);
  const [eUp, setEUp] = useState(0);
  const [eDown, setEDown] = useState(0);
  const [focusOverlayIndex, setFocusOverlayIndex] = useState<string>("");
  const [focusZoom, setFocusZoom] = useState(2);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const availableTemplates = templates.filter(t => t.name !== "FVSequence" && t.name !== "Circles" && t.name !== "RoundedRectangle" && t.name !== "ImageObject" && t.name !== "VideoObject" && t.name !== "FinalComposition");
  const availableObjects = ["Circles", "RoundedRectangle", "ImageObject", "VideoObject", "SequenceObject"];
  const positions: Position[] = ['left-top', 'center-top', 'right-top', 'left-center', 'center-center', 'right-center', 'left-bottom', 'center-bottom', 'right-bottom'];

  const mainReferenceObjects = useMemo(() => overlays.filter(o => (o.name === "ImageObject" || o.name === "RoundedRectangle" || o.name === "SequenceObject") && o.props?.sizeMode === "main"), [overlays]);

  const setPreset = (w: number, h: number) => { setWidth(w); setHeight(h); };

  const addToSequence = () => {
    setSequence([...sequence, selectedTemplate]);
  };

  const addToOverlays = () => {
    const newObj: Overlay = { 
      name: selectedObject, position: selectedPosition,
      startFrame: objStartFrame, endFrame: objEndFrame,
      constrained: objConstrained,
      props: { 
        imageSrc: (selectedObject === "VideoObject" || selectedObject === "SequenceObject") ? undefined : objImage,
        videoSrc: selectedObject === "VideoObject" ? objImage : undefined,
        sequence: selectedObject === "SequenceObject" ? objSequence.split(',').map(s => s.trim()) : undefined,
        label: objLabel, 
        sizeMode: selectedSizeMode,
        referenceOverlayIndex: selectedSizeMode === 'small' ? referenceOverlayIndex : undefined,
        imageSrcSlot: (selectedObject !== "SequenceObject") ? imageSlot : undefined,
        videoSrcSlot: selectedObject === "VideoObject" ? imageSlot : undefined,
        labelSlot: labelSlot,
        sequenceSlot: selectedObject === "SequenceObject" ? sequenceSlot : undefined,
        extraHoldFrames: objExtraHold
      }
    };
    if (editingObjIndex !== null) {
      const newOverlays = [...overlays];
      newOverlays[editingObjIndex] = newObj;
      setOverlays(newOverlays);
      setEditingObjIndex(null);
      showSuccess("Object updated!");
    } else {
      setOverlays([...overlays, newObj]);
      showSuccess("Object added!");
    }
    setImageSlot(null); setLabelSlot(null); setSequenceSlot(null); setObjExtraHold(0);
  };

  const editObject = (index: number) => {
    const obj = overlays[index];
    setEditingObjIndex(index);
    setSelectedObject(obj.name);
    if (obj.position) setSelectedPosition(obj.position);
    setObjStartFrame(obj.startFrame);
    setObjEndFrame(obj.endFrame);
    setObjConstrained(!!obj.constrained);
    setObjLabel(obj.props?.label || "");
    setSelectedSizeMode(obj.props?.sizeMode || "keep");
    setReferenceOverlayIndex(obj.props?.referenceOverlayIndex || "");
    setObjExtraHold(obj.props?.extraHoldFrames || 0);
    
    if (obj.name === "SequenceObject") {
      setObjSequence(obj.props?.sequence?.join(', ') || "");
      setSequenceSlot(obj.props?.sequenceSlot || null);
    } else {
      setObjImage(obj.props?.imageSrc || obj.props?.videoSrc || "/placeholder.png");
      setImageSlot(obj.props?.imageSrcSlot || obj.props?.videoSrcSlot || null);
    }
    setLabelSlot(obj.props?.labelSlot || null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addBatchToOverlays = () => {
    const imgList = batchImages.split(',').map(s => s.trim()).filter(s => s !== "");
    const labelList = batchLabels.split(',').map(s => s.trim()).filter(s => s !== "");
    const newBatch: Overlay[] = Array.from({ length: batchCount }).map((_, i) => ({
      name: selectedObject,
      grid: { index: i, total: batchCount, columns: batchCols },
      startFrame: objStartFrame, endFrame: objEndFrame,
      constrained: objConstrained,
      props: {
        imageSrc: (selectedObject === "VideoObject" || selectedObject === "SequenceObject") ? undefined : (imgList[i % imgList.length] || objImage),
        videoSrc: selectedObject === "VideoObject" ? (imgList[i % imgList.length] || objImage) : undefined,
        sequence: selectedObject === "SequenceObject" ? objSequence.split(',').map(s => s.trim()) : undefined,
        label: labelList[i % labelList.length] || (objLabel ? `${objLabel} ${i+1}` : ""),
        sizeMode: selectedSizeMode,
        referenceOverlayIndex: selectedSizeMode === 'small' ? referenceOverlayIndex : undefined,
        extraHoldFrames: objExtraHold
      }
    }));
    setOverlays([...overlays, ...newBatch]);
    showSuccess(`Added ${batchCount} objects!`);
  };

  const currentMovement = useMemo(() => {
    if (cameraTool === 'focus' && focusOverlayIndex !== "") {
      const overlay = overlays[parseInt(focusOverlayIndex)];
      if (overlay) {
        let coords = { x: 0, y: 0 };
        if (overlay.position) {
          if (overlay.position.includes('left')) coords.x = -width/2 + (width * 0.1);
          if (overlay.position.includes('right')) coords.x = width/2 - (width * 0.1);
          if (overlay.position.includes('top')) coords.y = -height/2 + (height * 0.1);
          if (overlay.position.includes('bottom')) coords.y = height/2 - (height * 0.1);
        } else if (overlay.grid) {
          const boxW = overlay.constrained ? width * 0.8 : width;
          const boxH = overlay.constrained ? height * 0.8 : height;
          const cols = overlay.grid.columns;
          const rows = Math.ceil(overlay.grid.total / cols);
          const col = overlay.grid.index % cols;
          const row = Math.floor(overlay.grid.index / cols);
          const cellW = boxW / cols;
          const cellH = boxH / rows;
          coords.x = (col * cellW + cellW / 2) - boxW / 2;
          coords.y = (row * cellH + cellH / 2) - boxH / 2;
        }
        return { startFrame: camStartFrame, endFrame: camEndFrame, startZoom, endZoom: focusZoom, startX: (sRight - sLeft) * UNIT_SIZE, startY: (sDown - sUp) * UNIT_SIZE, endX: coords.x, endY: coords.y };
      }
    }
    return { startFrame: camStartFrame, endFrame: camEndFrame, startZoom, endZoom, startX: (sRight - sLeft) * UNIT_SIZE, startY: (sDown - sUp) * UNIT_SIZE, endX: (eRight - eLeft) * UNIT_SIZE, endY: (eDown - eUp) * UNIT_SIZE };
  }, [cameraTool, focusOverlayIndex, focusZoom, startZoom, endZoom, sLeft, sRight, sUp, sDown, eLeft, eRight, eUp, eDown, overlays, width, height, camStartFrame, camEndFrame]);

  const addCameraMovement = () => {
    const movementToAdd = { ...currentMovement };
    setCameraMovements([...cameraMovements, movementToAdd]);
    setCamStartFrame(camEndFrame); setCamEndFrame(camEndFrame + 60);
  };

  const handleGridInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 2 - 1; 
    const y = ((clientY - rect.top) / rect.height) * 2 - 1; 
    const unitX = x * GRID_RANGE;
    const unitY = y * GRID_RANGE;
    setELeft(unitX < 0 ? Math.abs(unitX) : 0); setERight(unitX > 0 ? unitX : 0);
    setEUp(unitY < 0 ? Math.abs(unitY) : 0); setEDown(unitY > 0 ? unitY : 0);
  };

  const totalFrames = useMemo(() => {
    const mainFrames = sequence.reduce((acc, name) => {
      const t = templates.find(temp => temp.name === name);
      return acc + (t?.durationInFrames || 0);
    }, 0) || 30;
    return Math.max(mainFrames, 30);
  }, [sequence]);

  const renderCommand = useMemo(() => {
    const props = JSON.stringify({ sequence, overlays, cameraMovements });
    const escapedProps = props.replace(/"/g, '\\"');
    return `npx remotion render remotion/src/index.ts FVSequence ${outputName || "output"}.mp4 --props="${escapedProps}" --duration=${totalFrames}`;
  }, [sequence, overlays, cameraMovements, outputName, totalFrames]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">SV Video Creator</h1>
            <div className="flex bg-muted p-1 rounded-lg w-fit">
              <Button variant="ghost" size="sm" className="bg-background shadow-sm" asChild><Link to="/sv-video-creator">Creator</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/remotion-preview">Previewer</Link></Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImageSearch />
            <Button variant="outline" size="sm" onClick={resetProject}><FilePlus className="h-4 w-4 mr-2" /> New Project</Button>
            <Button variant="outline" size="sm" onClick={saveAsTemplate} className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"><CloudUpload className="h-4 w-4 mr-2" /> Save to Server</Button>
            <Button variant="outline" size="sm" onClick={() => setHidePanels(!hidePanels)} className="hidden sm:flex">{hidePanels ? <Maximize2 className="h-4 w-4 mr-2" /> : <Minimize2 className="h-4 w-4 mr-2" />}{hidePanels ? "Show Panels" : "Hide Panels"}</Button>
            <Button variant="outline" size="sm" asChild><Link to="/">Back to Home</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {!hidePanels && (
            <div className="lg:col-span-4 space-y-6 max-h-[85vh] overflow-y-auto pr-2">
              <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> Project Settings</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold">Name</label>
                    <Input placeholder="output" value={outputName} onChange={e => setOutputName(e.target.value)} className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold">Template #</label>
                    <Input placeholder="1" value={templateNumber} onChange={e => setTemplateNumber(e.target.value)} className="h-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> AI Description</label>
                  <Textarea 
                    placeholder="Describe when the AI should use this template..." 
                    value={templateDescription} 
                    onChange={e => setTemplateDescription(e.target.value)} 
                    className="min-h-[60px] text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold flex items-center gap-1"><Anchor className="h-3 w-3" /> Stretch Hinge (Frame)</label>
                  <Input type="number" value={stretchFrame} onChange={e => setStretchFrame(Number(e.target.value))} className="h-8" />
                </div>
                <div className="grid grid-cols-3 gap-2"><Button variant="outline" size="sm" className="text-[10px]" onClick={() => setPreset(1920, 1080)}>16:9</Button><Button variant="outline" size="sm" className="text-[10px]" onClick={() => setPreset(1080, 1920)}>9:16</Button><Button variant="outline" size="sm" className="text-[10px]" onClick={() => setPreset(1080, 1080)}>1:1</Button></div>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><CloudUpload className="h-4 w-4" /> Server Templates (Files)</CardTitle></CardHeader><CardContent className="space-y-2">
                {savedTemplates.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No files in public/templates/ yet.</p>}
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/10 text-[10px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-4 px-1 text-[8px]">{t.number || '?'}</Badge>
                      <span className="truncate font-bold">{t.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => loadProject(t)}><FolderOpen className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteTemplate(t.name)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent></Card>

              <Card><CardHeader><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><CardTitle className="text-sm flex items-center gap-2"><CameraIcon className="h-4 w-4" /> Camera Tool</CardTitle><Select value={cameraTool} onValueChange={(v: any) => setCameraTool(v)}><SelectTrigger className="h-8 w-full sm:w-[130px] text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="path">Custom Path</SelectItem><SelectItem value="focus">Object Focus</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] uppercase">Start Frame</label><Input type="number" value={camStartFrame} onChange={e => setCamStartFrame(Number(e.target.value))} className="h-8" /></div><div className="space-y-1"><label className="text-[10px] uppercase">End Frame</label><Input type="number" value={camEndFrame} onChange={e => setCamEndFrame(Number(e.target.value))} className="h-8" /></div></div>
                {cameraTool === 'path' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><label className="text-[10px] uppercase">Method</label><Select value={inputMethod} onValueChange={(v: any) => setInputMethod(v)}><SelectTrigger className="h-7 w-[90px] text-[9px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="visual">Visual</SelectItem></SelectContent></Select></div>
                    {inputMethod === "manual" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] uppercase">Start Zoom</label><Input type="number" step="0.1" value={startZoom} onChange={e => setStartZoom(Number(e.target.value))} className="h-8" /></div><div className="space-y-1"><label className="text-[10px] uppercase">End Zoom</label><Input type="number" step="0.1" value={endZoom} onChange={e => setEndZoom(Number(e.target.value))} className="h-8" /></div></div>
                        <div className="grid grid-cols-2 gap-2"><Input type="number" value={eLeft} onChange={e => setELeft(Number(e.target.value))} placeholder="L" className="h-7 text-xs" /><Input type="number" value={eRight} onChange={e => setERight(Number(e.target.value))} placeholder="R" className="h-7 text-xs" /><Input type="number" value={eUp} onChange={e => setEUp(Number(e.target.value))} placeholder="U" className="h-7 text-xs" /><Input type="number" value={eDown} onChange={e => setEDown(Number(e.target.value))} placeholder="D" className="h-7 text-xs" /></div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <div ref={gridRef} className="relative w-full bg-muted rounded border-2 border-dashed cursor-crosshair overflow-hidden" style={{ aspectRatio: `${width}/${height}` }} onMouseDown={(e) => { setIsDragging(true); handleGridInteraction(e); }} onMouseMove={(e) => isDragging && handleGridInteraction(e)} onMouseUp={() => setIsDragging(false)}>
                          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-5">{Array.from({length: 100}).map((_, i) => <div key={i} className="border-[0.5px] border-foreground" />)}</div>
                          <div className="absolute w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow" style={{ left: `${((eRight - eLeft) / GRID_RANGE + 1) * 50}%`, top: `${((eDown - eUp) / GRID_RANGE + 1) * 50}%` }} />
                        </div>
                        <div className="flex flex-col gap-1"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEndZoom(prev => Math.min(prev + 0.1, 5))}><ZoomIn className="h-3 w-3" /></Button><div className="text-[9px] font-bold text-center">{endZoom.toFixed(1)}x</div><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEndZoom(prev => Math.max(prev - 0.1, 0.1))}><ZoomOut className="h-3 w-3" /></Button></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4"><Select value={focusOverlayIndex} onValueChange={setFocusOverlayIndex}><SelectTrigger className="h-8"><SelectValue placeholder="Choose object..." /></SelectTrigger><SelectContent>{overlays.map((obj, i) => <SelectItem key={i} value={i.toString()}>#{i+1} {obj.name}</SelectItem>)}</SelectContent></Select><Input type="number" step="0.1" value={focusZoom} onChange={e => setFocusZoom(Number(e.target.value))} className="h-8" /></div>
                )}
                <div className="grid grid-cols-2 gap-2"><Button onClick={addCameraMovement} className="h-8 text-xs" variant="secondary"><Plus className="h-3 w-3 mr-2" /> Add Movement</Button><Button onClick={() => setCameraMovements([])} className="h-8 text-xs" variant="outline"><RotateCcw className="h-3 w-3 mr-2" /> Reset</Button></div>
                <div className="space-y-1 max-h-[100px] overflow-y-auto">{cameraMovements.map((m, i) => <div key={i} className="flex items-center justify-between p-1.5 rounded text-[9px] bg-secondary/50"><span>F:{m.startFrame}-{m.endFrame} | {m.endZoom}x</span><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { const n = [...cameraMovements]; n.splice(i, 1); setCameraMovements(n); }}><Trash2 className="h-3 w-3 text-destructive" /></Button></div></div>)}</div>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-sm">Sequence</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Select value={selectedTemplate} onValueChange={setSelectedTemplate}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{availableTemplates.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select><Button onClick={addToSequence} size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button></div><div className="space-y-1">{sequence.map((name, i) => <div key={i} className="flex items-center justify-between p-1.5 rounded text-[10px] bg-secondary/30"><span>{name}</span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { const n = [...sequence]; n.splice(i, 1); setSequence(n); }}><Trash2 className="h-3 w-3 text-destructive" /></Button></div>)}</div></CardContent></Card>

              <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> {editingObjIndex !== null ? "Edit Object" : "Objects"}</CardTitle></CardHeader><CardContent className="space-y-3">
                <Tabs defaultValue="single" className="w-full"><TabsList className="grid w-full grid-cols-2 h-8"><TabsTrigger value="single" className="text-[10px] uppercase">Single</TabsTrigger><TabsTrigger value="batch" className="text-[10px] uppercase">Batch</TabsTrigger></TabsList>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Select value={selectedObject} onValueChange={setSelectedObject}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{availableObjects.map(obj => <SelectItem key={obj} value={obj}>{obj}</SelectItem>)}</SelectContent></Select>
                      <TabsContent value="single" className="m-0"><Select value={selectedPosition} onValueChange={(v) => setSelectedPosition(v as Position)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></TabsContent>
                      <TabsContent value="batch" className="m-0"><div className="flex items-center gap-1"><Grid3X3 className="h-3 w-3" /><Input type="number" value={batchCols} onChange={e => setBatchCols(Number(e.target.value))} className="h-8" /></div></TabsContent>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedObject === "SequenceObject" ? (
                        <div className="space-y-1 col-span-1 sm:col-span-2">
                          <Label className="text-[9px] uppercase font-bold">Sequence Data</Label>
                          <SlotPicker 
                            value={sequenceSlot} 
                            onChange={setSequenceSlot} 
                            maxSlots={maxSlots} 
                            onIncrement={() => setMaxSlots(prev => prev + 1)} 
                            onDecrement={() => setMaxSlots(prev => Math.max(1, prev - 1))}
                          />
                          <Input value={objSequence} onChange={e => setObjSequence(e.target.value)} className="h-8 text-[10px]" placeholder="TypewriterText|Hello|60, FadeInImage|/img.png|30" />
                          {sequenceSlot && <Badge variant="secondary" className="text-[8px] bg-blue-100 text-blue-700 border-blue-200">Linked to Slot {sequenceSlot}</Badge>}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-bold">{selectedObject === "VideoObject" ? "Video Source" : "Source (URL/Path)"}</Label>
                            <SlotPicker 
                              value={imageSlot} 
                              onChange={setImageSlot} 
                              maxSlots={maxSlots} 
                              onIncrement={() => setMaxSlots(prev => prev + 1)} 
                              onDecrement={() => setMaxSlots(prev => Math.max(1, prev - 1))}
                            />
                            <Input value={objImage} onChange={e => setObjImage(e.target.value)} className="h-8 text-[10px]" placeholder="Preview URL or Path" />
                            {imageSlot && <Badge variant="secondary" className="text-[8px] bg-blue-100 text-blue-700 border-blue-200">Linked to Slot {imageSlot}</Badge>}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-bold">Size</Label>
                            <div className="h-6 hidden sm:block" />
                            <Select value={selectedSizeMode} onValueChange={setSelectedSizeMode}>
                              <SelectTrigger className="h-8 text-[10px] uppercase"><SelectValue placeholder="Size" /></SelectTrigger>
                              <SelectContent><SelectItem value="main">Main</SelectItem><SelectItem value="small">Small</SelectItem><SelectItem value="keep">Keep</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                    {selectedObject !== "SequenceObject" && selectedSizeMode === 'small' && mainReferenceObjects.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold">Reference Main Object</label>
                        <Select value={referenceOverlayIndex} onValueChange={setReferenceOverlayIndex}>
                          <SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Select reference..." /></SelectTrigger>
                          <SelectContent>{mainReferenceObjects.map((obj, i) => <SelectItem key={i} value={i.toString()}>#{i+1} {obj.props?.label || 'Main Object'}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold">Label</Label>
                        <SlotPicker 
                          value={labelSlot} 
                          onChange={setLabelSlot} 
                          maxSlots={maxSlots} 
                          onIncrement={() => setMaxSlots(prev => prev + 1)} 
                          onDecrement={() => setMaxSlots(prev => Math.max(1, prev - 1))}
                        />
                        <Input value={objLabel} onChange={e => setObjLabel(e.target.value)} className="h-8 text-[10px]" placeholder="Preview Label" />
                        {labelSlot && <Badge variant="secondary" className="text-[8px] bg-blue-100 text-blue-700 border-blue-200">Linked to Slot {labelSlot}</Badge>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Extra Hold</Label>
                        <div className="h-6 hidden sm:block" />
                        <Input type="number" value={objExtraHold} onChange={e => setObjExtraHold(Number(e.target.value))} className="h-8 text-[10px]" />
                      </div>
                    </div>
                    <TabsContent value="batch" className="m-0 space-y-3"><Input type="number" value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} className="h-8" placeholder="Count" /><Textarea value={batchImages} onChange={e => setBatchImages(e.target.value)} className="text-[10px] min-h-[60px]" placeholder="url1, url2..." /><Textarea value={batchLabels} onChange={e => setBatchLabels(e.target.value)} className="text-[10px] min-h-[60px]" placeholder="label1, label2..." /></TabsContent>
                    <div className="grid grid-cols-2 gap-2"><Input type="number" value={objStartFrame} onChange={e => setObjStartFrame(Number(e.target.value))} className="h-8" /><Input type="number" value={objEndFrame} onChange={e => setObjEndFrame(Number(e.target.value))} className="h-8" /></div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded border border-dashed"><Label className="text-[10px] uppercase">Constrain</Label><Switch checked={objConstrained} onCheckedChange={setObjConstrained} /></div>
                    <TabsContent value="single" className="m-0">
                      <div className="flex gap-2">
                        <Button onClick={addToOverlays} className="flex-1 h-8 text-xs" variant="secondary">
                          {editingObjIndex !== null ? <Check className="h-3 w-3 mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                          {editingObjIndex !== null ? "Update Object" : "Add Object"}
                        </Button>
                        {editingObjIndex !== null && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingObjIndex(null)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="batch" className="m-0"><Button onClick={addBatchToOverlays} className="w-full h-8 text-xs" variant="secondary"><Grid3X3 className="h-3 w-3 mr-2" /> Add Batch</Button></TabsContent>
                  </div>
                </Tabs>
                <div className="space-y-1 max-h-[150px] overflow-y-auto border-t pt-2">
                  {overlays.map((obj, i) => (
                    <div key={i} className={`flex items-center justify-between p-1.5 rounded text-[10px] ${editingObjIndex === i ? 'bg-blue-100 border border-blue-300' : 'bg-secondary/30'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">#{i+1}</span>
                        <span>{obj.name}</span>
                        <span className="text-muted-foreground">({obj.startFrame}-{obj.endFrame})</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => editObject(i)}>
                          <Pencil className="h-3 w-3 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { const n = [...overlays]; n.splice(i, 1); setOverlays(n); if (editingObjIndex === i) setEditingObjIndex(null); }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Template Rules</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2"><Button variant="outline" size="sm" className="h-8 text-[10px] uppercase gap-2" onClick={() => addRule('stretch')}><Sparkles className="h-3 w-3" /> Stretch Rule</Button></div>
                <div className="space-y-1 pt-2 border-t">{rules.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No rules active.</p>}{rules.map(rule => (<div key={rule.id} className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/10 text-[10px]"><span className="font-bold uppercase">{rule.type}</span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeRule(rule.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div>))}</div>
              </CardContent></Card>
            </div>
          )}

          <div className={hidePanels ? "lg:col-span-12 space-y-6" : "lg:col-span-8 space-y-6"}>
            <Card className="h-full"><CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle className="flex items-center gap-2"><Play className="h-5 w-5" /> Video Preview</CardTitle><div className="flex flex-wrap items-center gap-3"><div className="text-xs font-medium bg-muted px-2 py-1 rounded">{totalFrames} frames ({(totalFrames/30).toFixed(2)}s)</div><Dialog><DialogTrigger asChild><Button size="sm" className="h-8 gap-2"><Download className="h-4 w-4" /> Render</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Export Video</DialogTitle></DialogHeader><div className="mt-4 space-y-6"><div className="bg-black rounded-lg p-4 relative"><pre className="text-green-400 text-[10px] whitespace-pre-wrap break-all">{renderCommand}</pre></div></div></DialogContent></Dialog></div></CardHeader><CardContent><div className="bg-black rounded-lg overflow-hidden relative mx-auto shadow-2xl" style={{ aspectRatio: `${width}/${height}`, width: '100%' }}><Player key={`${width}-${height}-${JSON.stringify({sequence, overlays, cameraMovements})}`} component={FVSequence} inputProps={{ sequence, overlays, cameraMovements }} durationInFrames={totalFrames} fps={30} compositionWidth={width} compositionHeight={height} style={{ width: '100%', height: '100%' }} controls autoPlay /></div></CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SVVideoCreator;