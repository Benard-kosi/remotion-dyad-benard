"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Player } from "@remotion/player";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Film, Box, Play, RefreshCw } from "lucide-react";

// Import Remotion templates and components
import templates from "../../remotion/src/templates.json";
import * as UserComponents from "../../remotion/src/components";
import { FVSequence } from "../../remotion/src/components/FVSequence";

// Combine all Remotion components into a single object for easy lookup
const allRemotionComponents: { [key: string]: React.FC<any> } = {
  ...UserComponents,
};

const RemotionPreview: React.FC = () => {
  const [selectedComponentName, setSelectedComponentName] = useState<string | undefined>(
    templates.length > 0 ? templates[0].name : undefined
  );
  const [svTemplates, setSvTemplates] = useState<any[]>([]);
  const [selectedSvTemplate, setSelectedSvTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchServerTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setSvTemplates(data);
      } else {
        // Fallback: Try to list common template names if API fails
        console.warn("API failed, templates might not be visible if server is down.");
      }
    } catch (err) {
      console.error("Failed to fetch server templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerTemplates();
  }, []);

  const selectedComposition = useMemo(() => {
    return templates.find((t) => t.name === selectedComponentName);
  }, [selectedComponentName]);

  const ComponentToRender = useMemo(() => {
    return selectedComposition ? allRemotionComponents[selectedComposition.name] : undefined;
  }, [selectedComposition]);

  const svTotalFrames = useMemo(() => {
    if (!selectedSvTemplate) return 30;
    return selectedSvTemplate.sequence.reduce((acc: number, name: string) => {
      const t = templates.find(temp => temp.name === name);
      return acc + (t?.durationInFrames || 0);
    }, 0) || 30;
  }, [selectedSvTemplate]);

  const compositionWidth = 1920;
  const compositionHeight = 1080;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Remotion Preview
            </h1>
            <div className="flex bg-muted p-1 rounded-lg">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/video-creator">Creator</Link>
              </Button>
              <Button variant="ghost" size="sm" className="bg-background shadow-sm" asChild>
                <Link to="/remotion-preview">Previewer</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchServerTemplates} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Templates
            </Button>
            <Button variant="outline" asChild><Link to="/">Back to Home</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Box className="h-4 w-4" /> Base Templates</CardTitle>
                <Select
                  onValueChange={setSelectedComponentName}
                  value={selectedComponentName}
                >
                  <SelectTrigger className="w-[240px] h-8 text-xs">
                    <SelectValue placeholder="Select a component" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((comp) => (
                      <SelectItem key={comp.name} value={comp.name}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {ComponentToRender && selectedComposition ? (
                  <div 
                    className="bg-black rounded-md overflow-hidden mx-auto relative w-full aspect-video shadow-xl"
                  >
                    <Player
                      key={selectedComponentName}
                      component={ComponentToRender}
                      durationInFrames={selectedComposition.durationInFrames}
                      fps={30}
                      compositionWidth={compositionWidth}
                      compositionHeight={compositionHeight}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">
                    Select a base template to preview.
                  </p>
                )}
              </CardContent>
            </Card>

            {selectedSvTemplate && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Film className="h-4 w-4" /> SV Template: {selectedSvTemplate.name}</CardTitle>
                  <Badge variant="secondary">{svTotalFrames} frames</Badge>
                </CardHeader>
                <CardContent>
                  <div className="bg-black rounded-md overflow-hidden mx-auto relative w-full aspect-video shadow-xl">
                    <Player
                      key={selectedSvTemplate.id}
                      component={FVSequence}
                      inputProps={selectedSvTemplate}
                      durationInFrames={svTotalFrames}
                      fps={30}
                      compositionWidth={compositionWidth}
                      compositionHeight={compositionHeight}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Film className="h-4 w-4" /> Server Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {svTemplates.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-xs">
                    {isLoading ? "Loading templates..." : "No templates on server yet."}
                  </div>
                )}
                {svTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedSvTemplate(t)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      selectedSvTemplate?.id === t.id 
                        ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-4 px-1 text-[8px]">{t.number || '?'}</Badge>
                        <span className="text-xs font-bold">{t.name}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground uppercase">
                        {t.sequence.length} Backgrounds • {t.overlays.length} Objects
                      </span>
                    </div>
                    <Play className={`h-3 w-3 ${selectedSvTemplate?.id === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemotionPreview;