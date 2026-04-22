"use client";

import React, { useState, useEffect } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, Save, ArrowLeft, Layout, Type, 
  Activity, Settings2, CloudUpload, FolderOpen, RefreshCw, ImageIcon, Zap,
  MessageSquare, AlignCenter, Maximize
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { HUD, HUDTemplate, HUDElement, SubtitleSettings } from "../../remotion/src/components/HUD";

const HUDCreator = () => {
  const [hudName, setHudName] = useState("MyHUD");
  const [elements, setElements] = useState<HUDElement[]>([]);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    maxWordsPerChunk: 8,
    wordsPerSecond: 3,
    fontSize: 52,
    bottomPadding: 80
  });
  const [savedHuds, setSavedHuds] = useState<HUDTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHuds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/huds');
      if (res.ok) setSavedHuds(await res.json());
    } catch (err) {
      console.error("Failed to fetch HUDs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHuds();
  }, []);

  const addElement = (type: 'text' | 'progress' | 'image') => {
    const newEl: HUDElement = {
      type,
      content: type === 'text' ? '{{topic}}' : type === 'image' ? '/placeholder.png' : undefined,
      position: 'top-left',
      style: {},
      autoMap: true
    };
    setElements([...elements, newEl]);
  };

  const updateElement = (index: number, updates: Partial<HUDElement>) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], ...updates };
    setElements(newElements);
  };

  const removeElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const saveHud = async () => {
    if (!hudName) return showError("Name required");
    try {
      const res = await fetch('/api/huds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: hudName, elements, subtitleSettings })
      });
      if (res.ok) {
        showSuccess("HUD saved to server!");
        fetchHuds();
      }
    } catch (err) {
      showError("Save failed");
    }
  };

  const loadHud = (hud: HUDTemplate) => {
    setHudName(hud.name);
    setElements(hud.elements);
    if (hud.subtitleSettings) setSubtitleSettings(hud.subtitleSettings);
    showSuccess(`Loaded ${hud.name}`);
  };

  const deleteHud = async (name: string) => {
    try {
      const res = await fetch(`/api/huds/${name}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("HUD deleted");
        fetchHuds();
      }
    } catch (err) {
      showError("Delete failed");
    }
  };

  const currentTemplate: HUDTemplate = { name: hudName, elements, subtitleSettings };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Layout className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">HUD Creator</h1>
              <p className="text-sm text-muted-foreground">Design persistent overlays and subtitle styles.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveHud} className="bg-blue-600/10 text-blue-600 border-blue-600/20">
              <CloudUpload className="h-4 w-4 mr-2" /> Save HUD
            </Button>
            <Button variant="outline" asChild><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> HUD Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase">HUD Name</label>
                  <Input value={hudName} onChange={e => setHudName(e.target.value)} className="h-8" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addElement('text')} className="text-[9px] uppercase px-1">
                    <Type className="h-3 w-3 mr-1" /> Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addElement('image')} className="text-[9px] uppercase px-1">
                    <ImageIcon className="h-3 w-3 mr-1" /> Image
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addElement('progress')} className="text-[9px] uppercase px-1">
                    <Activity className="h-3 w-3 mr-1" /> Progress
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                  <MessageSquare className="h-4 w-4" /> Subtitle Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold">Max Words/Chunk</Label>
                    <Input 
                      type="number" 
                      value={subtitleSettings.maxWordsPerChunk} 
                      onChange={e => setSubtitleSettings({...subtitleSettings, maxWordsPerChunk: Number(e.target.value)})} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold">Words Per Second</Label>
                    <Input 
                      type="number" 
                      value={subtitleSettings.wordsPerSecond} 
                      onChange={e => setSubtitleSettings({...subtitleSettings, wordsPerSecond: Number(e.target.value)})} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold flex items-center gap-1"><Maximize className="h-3 w-3" /> Font Size</Label>
                    <Input 
                      type="number" 
                      value={subtitleSettings.fontSize} 
                      onChange={e => setSubtitleSettings({...subtitleSettings, fontSize: Number(e.target.value)})} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold flex items-center gap-1"><AlignCenter className="h-3 w-3" /> Bottom Pad</Label>
                    <Input 
                      type="number" 
                      value={subtitleSettings.bottomPadding} 
                      onChange={e => setSubtitleSettings({...subtitleSettings, bottomPadding: Number(e.target.value)})} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground italic">These settings control how the Script Creator chunks your text into subtitles.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Elements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {elements.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No elements added.</p>}
                {elements.map((el, i) => (
                  <div key={i} className="p-3 rounded border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-blue-600">{el.type}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeElement(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-background rounded border border-dashed">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-blue-500" />
                        <Label className="text-[9px] uppercase font-bold">Auto-Mapping</Label>
                      </div>
                      <Switch 
                        checked={el.autoMap !== false} 
                        onCheckedChange={(val) => updateElement(i, { autoMap: val })} 
                      />
                    </div>

                    {(el.type === 'text' || el.type === 'image') && (
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">
                          {el.autoMap !== false ? "Fallback Content" : "Static Content"}
                        </Label>
                        <Input 
                          value={el.content} 
                          onChange={e => updateElement(i, { content: e.target.value })} 
                          className="h-7 text-[10px]" 
                          placeholder={el.type === 'text' ? "Text content..." : "Image URL..."}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground">Position</Label>
                      <Select value={el.position} onValueChange={(v: any) => updateElement(i, { position: v })}>
                        <SelectTrigger className="h-7 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-center">Top Center</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-center">Bottom Center</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Saved HUDs</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchHuds} disabled={isLoading}>
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedHuds.map(hud => (
                  <div key={hud.name} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-[10px]">
                    <span className="font-bold">{hud.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => loadHud(hud)}><FolderOpen className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteHud(hud.name)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card>
              <CardHeader><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg overflow-hidden relative w-full aspect-video shadow-2xl">
                  <Player
                    component={HUD}
                    inputProps={{ template: currentTemplate, topicLabel: "PREVIEW TOPIC", imageUrl: "/placeholder.png", groupDuration: 300 }}
                    durationInFrames={300}
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
      </div>
    </div>
  );
};

export default HUDCreator;