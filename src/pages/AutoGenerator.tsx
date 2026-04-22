"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, FileText, Code, Loader2, Copy, Check, Wand2, Download, FlaskConical, LayoutGrid, BrainCircuit, Settings2, Cpu, Key, RotateCcw, ArrowDown, ListChecks, FileJson, Layers, User, BookOpen, Info, AlertCircle, Layout, ExternalLink, ShieldCheck, ShieldAlert, Scan, Filter,
  Settings, Send, Save, RefreshCw, Dices, Lightbulb, ChevronDown, ChevronUp
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DEFAULT_SYSTEM_MESSAGE_0 = `You are a professional YouTube video script writer specializing in explainer content. You will receive a topic category and a number of subtopics to cover. Output ONLY a valid JSON object. No explanations, no markdown, no extra text.

Your job: Generate a complete, engaging video script with the requested number of subtopics. Each subtopic should be explained clearly and in an entertaining way suitable for a YouTube audience.

SCRIPT RULES:
- Write in a clear, engaging, conversational tone suitable for voiceover
- Each subtopic should have enough content to fill its section naturally
- Do not use headers or formatting inside the script text, just plain flowing sentences
- Explain concepts as if the viewer has no prior knowledge
- Keep each subtopic focused on one clear idea or concept
- Make transitions between subtopics feel natural

OUTPUT THIS EXACT JSON STRUCTURE:
{
  "title": "<Video Title>",
  "category": "<Category Name, e.g. Anime, History, Science, Tech>",
  "script": "<Full script text with all subtopics written out as one continuous voiceover. Each subtopic name must appear on its own line followed by the explanation paragraph.>"
}

EXAMPLE OUTPUT FORMAT FOR SCRIPT FIELD:
"Haki (One Piece)\\n\\nHaki is a mysterious power that exists in every living being in the world of One Piece...\\n\\nNen (Hunter x Hunter)\\n\\nNen is a technique that allows users to manipulate their own life energy...\\n\\nCursed Energy (Jujutsu Kaisen)\\n\\nCursed energy is born from negative human emotions and is the foundation of all jujutsu techniques..."

The script field must be a single string with all subtopics written sequentially. Each subtopic name must appear on its own line so the system can identify and split them later.`;

const DEFAULT_SYSTEM_MESSAGE_1 = `You are a video planning assistant. Analyze the transcript and output ONLY a valid JSON object. No explanations, no markdown, no extra text.

Your job:
1. Identify all topics being explained in the transcript.
2. For the label, include the specific subject and the anime name in parentheses if present (e.g., "Nen (Hunter x Hunter)").
3. Estimate how long each topic is discussed in seconds. Assume ~3 words per second.
4. Identify the overall category of the video (e.g. Anime, History, Science).

OUTPUT THIS EXACT JSON STRUCTURE:
{
  "category": "<Category Name>",
  "topics": [
    {
      "label": "<Topic Name>",
      "duration_seconds": <number>
    }
  ]
}`;

const DEFAULT_SYSTEM_MESSAGE_2 = `You are a video content planner. You will receive a transcript and a specific topic to focus on. Output ONLY a valid JSON object. No explanations, no markdown, no extra text.

Your job: Read the transcript for the given topic and break it down into visual moments. For each moment, pick the best template from the **SERVER TEMPLATES** list provided at the end of this message.

**TEMPLATE SELECTION RULES:**
- Analyze the **SERVER TEMPLATES** list below to find the most appropriate visual match for each part of the transcript based on the descriptions provided.
- **DEFAULT**: If you are unsure which specific template to use, use "default(img)" for static images or "default(vid)" for video clips.
- Match the \`template\` field in your JSON to the **Number** or **Name** found in the SERVER TEMPLATES list.

**TIMING RULES:**
- Assume 3 words per second when estimating duration.
- Minimum moment duration is 5 seconds.
- Maximum moment duration is 30 seconds.
- All duration_estimates must add up to approximately duration_seconds.
- Each moment should cover a natural chunk of the transcript, not mid-sentence.

**OUTPUT THIS EXACT JSON STRUCTURE:**
{
  "label": "<Topic Name>",
  "duration_seconds": <number>,
  "moments": [
    {
      "template": "<Number or Name>",
      "duration_estimate": <seconds>
    }
  ]
}`;

const PROVIDER_DEFAULTS: Record<string, string> = {
  openrouter: "google/gemma-3-27b-it:free",
  groq: "llama-3.1-8b-instant",
  anthropic: "claude-haiku-4-5-20251001"
};

const RANDOM_TOPICS = [
  "Anime Power Systems",
  "Cyberpunk Cities",
  "Ancient Mythology",
  "Space Exploration",
  "Future Tech",
  "Legendary Swords",
  "Hidden History",
  "Mysterious Creatures",
  "Lost Civilizations",
  "Iconic Anime Rivalries",
  "Evolution of Gaming",
  "Deep Sea Mysteries",
  "Martial Arts Styles",
  "Sci-Fi Weaponry",
  "Famous Heists in History",
  "The Multiverse Theory",
  "Artificial Intelligence Ethics",
  "Post-Apocalyptic Survival",
  "The Golden Age of Piracy",
  "Urban Legends"
];

const AutoGenerator = () => {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [serverTemplates, setServerTemplates] = useState<any[]>([]);
  const [huds, setHuds] = useState<any[]>([]);
  const [selectedHud, setSelectedHud] = useState<string>("none");
  
  // Step 0 State (Full Auto)
  const [isFullAutoOpen, setIsFullAutoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topicCategory, setTopicCategory] = useState("");
  const [subtopicCount, setSubtopicCount] = useState(3);
  const [systemMessage0, setSystemMessage0] = useState(() => localStorage.getItem("ai_system_message_0") || DEFAULT_SYSTEM_MESSAGE_0);
  const [provider0, setProvider0] = useState(() => localStorage.getItem("ai_provider_0") || "groq");
  const [model0, setModel0] = useState(() => localStorage.getItem("ai_model_0") || PROVIDER_DEFAULTS.groq);
  const [apiKey0, setApiKey0] = useState("");

  // Step 1 State
  const [systemMessage1, setSystemMessage1] = useState(() => localStorage.getItem("ai_system_message_1") || DEFAULT_SYSTEM_MESSAGE_1);
  const [provider1, setProvider1] = useState(() => localStorage.getItem("ai_provider_1") || "groq");
  const [model1, setModel1] = useState(() => localStorage.getItem("ai_model_1") || PROVIDER_DEFAULTS.groq);
  const [apiKey1, setApiKey1] = useState("");
  const [step1Output, setStep1Output] = useState("");
  const [isStep1Open, setIsStep1Open] = useState(false);

  // Step 2 State
  const [systemMessage2, setSystemMessage2] = useState(() => localStorage.getItem("ai_system_message_2") || DEFAULT_SYSTEM_MESSAGE_2);
  const [provider2, setProvider2] = useState(() => localStorage.getItem("ai_provider_2") || "openrouter");
  const [model2, setModel2] = useState(() => localStorage.getItem("ai_model_2") || PROVIDER_DEFAULTS.openrouter);
  const [apiKey2, setApiKey2] = useState("");
  const [topicJson, setTopicJson] = useState("");
  const [isTopicJsonOpen, setIsTopicJsonOpen] = useState(false);

  const [mainScript, setMainScript] = useState("");
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);
  const [loopProgress, setLoopProgress] = useState({ current: 0, total: 0 });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  
  const [generatedScript, setGeneratedScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [faceDetection, setFaceDetection] = useState(true);

  const fetchData = async () => {
    try {
      const [templatesRes, hudsRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/huds')
      ]);
      
      if (templatesRes.ok) setServerTemplates(await templatesRes.json());
      if (hudsRes.ok) setHuds(await hudsRes.json());
    } catch (err) {
      console.error("Failed to fetch server data");
    }
  };

  useEffect(() => {
    fetchData();
    localStorage.setItem("ai_system_message_0", systemMessage0);
    localStorage.setItem("ai_system_message_1", systemMessage1);
    localStorage.setItem("ai_system_message_2", systemMessage2);
  }, [systemMessage0, systemMessage1, systemMessage2]);

  useEffect(() => {
    const k0 = localStorage.getItem(`api_key_${provider0}`);
    if (k0) setApiKey0(k0);
  }, [provider0]);

  useEffect(() => {
    const k1 = localStorage.getItem(`api_key_${provider1}`);
    if (k1) setApiKey1(k1);
  }, [provider1]);

  useEffect(() => {
    const k2 = localStorage.getItem(`api_key_${provider2}`);
    if (k2) setApiKey2(k2);
  }, [provider2]);

  const saveDefaults = (step: number) => {
    if (step === 0) {
      localStorage.setItem("ai_provider_0", provider0);
      localStorage.setItem("ai_model_0", model0);
    } else if (step === 1) {
      localStorage.setItem("ai_provider_1", provider1);
      localStorage.setItem("ai_model_1", model1);
    } else if (step === 2) {
      localStorage.setItem("ai_provider_2", provider2);
      localStorage.setItem("ai_model_2", model2);
    }
    showSuccess(`Step ${step} settings saved as default!`);
  };

  const handleRandomize = () => {
    const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    const randomCount = Math.floor(Math.random() * 5) + 3; // 3 to 7
    setTopicCategory(randomTopic);
    setSubtopicCount(randomCount);
    showSuccess(`Randomized: ${randomTopic} (${randomCount} topics)`);
  };

  const getTemplateSlots = (template: any) => {
    const str = JSON.stringify(template);
    const matches = str.match(/\{\{(\d+)\}\}/g) || [];
    const nums = matches.map(m => parseInt(m.replace('{{', '').replace('}}', '')));
    return nums.length > 0 ? Math.max(...nums) : 0;
  };

  const handleFullAutoGenerate = async () => {
    if (!topicCategory.trim()) return showError("Please enter a topic category.");
    
    setIsFullAutoOpen(false);
    setIsAiGenerating(true);
    setStep1Output("");
    setTopicJson("");
    setGeneratedScript("");
    
    try {
      // STEP 0: Generate Script
      setCurrentStep(0);
      const res0 = await fetch("/api/ai-generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: `TOPIC CATEGORY: ${topicCategory}\nNUMBER OF SUBTOPICS: ${subtopicCount}`, 
          systemMessage: systemMessage0,
          provider: provider0,
          model: model0,
          apiKey: apiKey0
        })
      });
      const data0 = await res0.json();
      if (!res0.ok) throw new Error(data0.error || "Step 0 failed");
      
      const fullScript = data0.script;
      setTranscript(fullScript);
      setMainScript(fullScript);

      // STEP 1: Extract Topics
      setCurrentStep(1);
      const res1 = await fetch("/api/ai-generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: `TRANSCRIPT:\n${fullScript}`, 
          systemMessage: systemMessage1,
          provider: provider1,
          model: model1,
          apiKey: apiKey1
        })
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Step 1 failed");
      
      const topics = Array.isArray(data1) ? data1 : (data1.topics || []);
      setStep1Output(JSON.stringify(data1, null, 2));
      setLoopProgress({ current: 0, total: topics.length });

      // STEP 2: Structure Moments
      setCurrentStep(2);
      const aggregatedTopics = [];
      for (let i = 0; i < topics.length; i++) {
        setLoopProgress(prev => ({ ...prev, current: i + 1 }));
        const topic = topics[i];
        const res2 = await fetch("/api/ai-generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transcript: `TOPIC TO FOCUS ON: ${topic.label}\nDURATION: ${topic.duration_seconds} seconds\n\nTRANSCRIPT:\n${fullScript}`, 
            systemMessage: systemMessage2,
            provider: provider2,
            model: model2,
            apiKey: apiKey2,
            isStep2: true 
          })
        });
        const structuredTopic = await res2.json();
        if (res2.ok) aggregatedTopics.push(structuredTopic);
      }

      setTopicJson(JSON.stringify({ category: data1.category || data0.category || topicCategory, topics: aggregatedTopics }, null, 2));
      showSuccess("AI Chain completed! You can now generate the final script.");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsAiGenerating(false);
      setCurrentStep(0);
    }
  };

  const handleAiGenerate = async () => {
    if (!transcript.trim()) return showError("Please paste a transcript first.");
    setIsAiGenerating(true);
    setStep1Output("");
    setTopicJson("");
    try {
      setCurrentStep(1);
      const res1 = await fetch("/api/ai-generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: `TRANSCRIPT:\n${transcript}`, systemMessage: systemMessage1, provider: provider1, model: model1, apiKey: apiKey1 })
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Step 1 failed");
      const topics = Array.isArray(data1) ? data1 : (data1.topics || []);
      setStep1Output(JSON.stringify(data1, null, 2));
      setLoopProgress({ current: 0, total: topics.length });
      setCurrentStep(2);
      const aggregatedTopics = [];
      for (let i = 0; i < topics.length; i++) {
        setLoopProgress(prev => ({ ...prev, current: i + 1 }));
        const res2 = await fetch("/api/ai-generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: `TOPIC: ${topics[i].label}\nTRANSCRIPT:\n${transcript}`, systemMessage: systemMessage2, provider: provider2, model: model2, apiKey: apiKey2, isStep2: true })
        });
        const structuredTopic = await res2.json();
        if (res2.ok) aggregatedTopics.push(structuredTopic);
      }
      setTopicJson(JSON.stringify({ category: data1.category || "General", topics: aggregatedTopics }, null, 2));
      setMainScript(transcript);
      showSuccess("AI Chain completed!");
    } catch (err: any) { showError(err.message); } finally { setIsAiGenerating(false); setCurrentStep(0); }
  };

  const handleGenerate = async (mode: 'full' | 'intro') => {
    if (!topicJson) return showError("Please provide the Topics JSON.");
    if (mode === 'full' && !mainScript) return showError("Full script requires the transcript text.");
    if (mode === 'intro') setIsGeneratingIntro(true); else setIsGenerating(true);
    try {
      let rawData = JSON.parse(topicJson);
      const topicsArray = Array.isArray(rawData) ? rawData : (rawData.topics || [rawData]);
      const category = rawData.category || null;

      const processedTopics = topicsArray.map((topic: any, index: number) => {
        const label = topic.label;
        const moments = topic.moments || [];
        if (mode === 'intro') return { label, moments: [] };
        const cleanLabel = label.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
        const nextTopic = topicsArray[index + 1];
        const nextLabel = nextTopic ? nextTopic.label.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase() : null;
        const lines = mainScript.split('\n');
        let startIndex = -1; let endIndex = lines.length;
        for (let i = 0; i < lines.length; i++) {
          const lineLower = lines[i].toLowerCase();
          if (startIndex === -1 && lineLower.includes(cleanLabel)) startIndex = i;
          else if (startIndex !== -1 && nextLabel && lineLower.includes(nextLabel)) { endIndex = i; break; }
        }
        const topicText = startIndex === -1 ? label : lines.slice(startIndex, endIndex).join(' ').replace(/\s+/g, ' ').trim();
        const allWords = topicText.split(' ').filter(w => w.length > 0);
        let wordPointer = 0;
        const momentsWithDescriptions = moments.map((m: any) => {
          const wordCount = Math.max(5, Math.ceil(m.duration_estimate * 3));
          const description = allWords.slice(wordPointer, wordPointer + wordCount).join(' ');
          wordPointer += wordCount;
          return { ...m, description: description || label };
        });
        return { label, moments: momentsWithDescriptions };
      });
      const res = await fetch('/api/generate-sv-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: processedTopics, category, testMode, faceDetection, introOnly: mode === 'intro', hudName: selectedHud === "none" ? null : selectedHud })
      });
      if (res.ok) { const result = await res.json(); setGeneratedScript(result.script); showSuccess("Script generated!"); }
      else showError("Generation failed.");
    } catch (err) { showError("Invalid JSON or Script format."); } finally { setIsGenerating(false); setIsGeneratingIntro(false); }
  };

  const handleSendToEditor = () => {
    if (!generatedScript) return showError("No script to send.");
    localStorage.setItem("pending_script", generatedScript);
    showSuccess("Opening Script Editor in new tab...");
    window.open("/script-creator", "_blank");
  };

  const applyHudToScript = () => {
    if (!generatedScript) return showError("Generate a script first.");
    
    let lines = generatedScript.split('\n');
    // Remove existing HUD lines
    lines = lines.filter(l => !l.trim().startsWith('HUD:'));
    
    if (selectedHud !== "none") {
      // Find all tags (#topic1, #topic2, etc)
      const tags = new Set<string>();
      lines.forEach(l => {
        const match = l.match(/#topic\d+/);
        if (match) tags.add(match[0]);
      });
      
      const sortedTags = Array.from(tags).sort((a, b) => {
        const numA = parseInt(a.replace('#topic', ''));
        const numB = parseInt(b.replace('#topic', ''));
        return numA - numB;
      });
      
      // For each tag, find the first occurrence and insert HUD line before it
      sortedTags.forEach(tag => {
        const firstIdx = lines.findIndex(l => l.includes(tag));
        if (firstIdx !== -1) {
          lines.splice(firstIdx, 0, `HUD: ${selectedHud} ${tag}`);
        }
      });
    }
    
    setGeneratedScript(lines.join('\n'));
    showSuccess(selectedHud === "none" ? "HUD removed from script" : `Applied ${selectedHud} to script!`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Magic Video Generator</h1>
            <p className="text-sm text-muted-foreground">AI-powered script writing and visual sequencing.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isFullAutoOpen} onOpenChange={setIsFullAutoOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Sparkles className="h-4 w-4" /> Full Auto Mode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Generate Full Video Script</DialogTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={handleRandomize}>
                    <Dices className="h-5 w-5" />
                  </Button>
                </div>
                <DialogDescription>Enter a topic and the AI will write the script and structure the video for you.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Topic Category</Label>
                  <Input placeholder="e.g. Anime Power Systems, Tech History..." value={topicCategory} onChange={e => setTopicCategory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Number of Subtopics</Label>
                  <div className="flex items-center gap-4">
                    <Input type="number" min={1} max={10} value={subtopicCount} onChange={e => setSubtopicCount(Number(e.target.value))} className="w-24" />
                    <span className="text-xs text-muted-foreground">Subtopics to cover in the video.</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFullAutoOpen(false)}>Cancel</Button>
                <Button onClick={handleFullAutoGenerate} className="bg-purple-600 hover:bg-purple-700">Start Generation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> AI Chain Settings</DialogTitle>
                <DialogDescription>Configure the system messages and models for each step of the AI chain.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="step0">
                    <AccordionTrigger className="text-[10px] uppercase font-bold py-2">Step 0: Script Writer (Full Auto)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">Model Settings</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1" onClick={() => saveDefaults(0)}>
                          <Save className="h-3 w-3" /> Save as Default
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={provider0} onValueChange={setProvider0}>
                          <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="openrouter">OpenRouter</SelectItem><SelectItem value="groq">Groq</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent>
                        </Select>
                        <Input value={model0} onChange={e => setModel0(e.target.value)} className="h-8 text-[10px] font-mono" />
                      </div>
                      <Input type="password" value={apiKey0} onChange={e => setApiKey0(e.target.value)} className="h-8 text-[10px] font-mono" placeholder="API Key (Optional)" />
                      <Textarea value={systemMessage0} onChange={e => setSystemMessage0(e.target.value)} className="min-h-[150px] text-[10px] font-mono bg-muted/50" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="step1">
                    <AccordionTrigger className="text-[10px] uppercase font-bold py-2">Step 1: Topic Extractor</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">Model Settings</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1" onClick={() => saveDefaults(1)}>
                          <Save className="h-3 w-3" /> Save as Default
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={provider1} onValueChange={setProvider1}>
                          <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="openrouter">OpenRouter</SelectItem><SelectItem value="groq">Groq</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent>
                        </Select>
                        <Input value={model1} onChange={e => setModel1(e.target.value)} className="h-8 text-[10px] font-mono" />
                      </div>
                      <Input type="password" value={apiKey1} onChange={e => setApiKey1(e.target.value)} className="h-8 text-[10px] font-mono" placeholder="API Key (Optional)" />
                      <Textarea value={systemMessage1} onChange={e => setSystemMessage1(e.target.value)} className="min-h-[150px] text-[10px] font-mono bg-muted/50" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="step2">
                    <AccordionTrigger className="text-[10px] uppercase font-bold py-2">Step 2: Visual Planner</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">Model Settings</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1" onClick={() => saveDefaults(2)}>
                          <Save className="h-3 w-3" /> Save as Default
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={provider2} onValueChange={setProvider2}>
                          <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="openrouter">OpenRouter</SelectItem><SelectItem value="groq">Groq</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent>
                        </Select>
                        <Input value={model2} onChange={e => setModel2(e.target.value)} className="h-8 text-[10px] font-mono" />
                      </div>
                      <Input type="password" value={apiKey2} onChange={e => setApiKey2(e.target.value)} className="h-8 text-[10px] font-mono" placeholder="API Key (Optional)" />
                      <Textarea value={systemMessage2} onChange={e => setSystemMessage2(e.target.value)} className="min-h-[150px] text-[10px] font-mono bg-muted/50" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>Close Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 border px-4 py-2 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <ShieldCheck className={`h-4 w-4 ${faceDetection ? 'text-green-500' : 'text-muted-foreground'}`} />
              <Label htmlFor="face-toggle" className="text-[10px] font-bold uppercase cursor-pointer">Face Filter</Label>
              <Switch id="face-toggle" checked={faceDetection} onCheckedChange={setFaceDetection} />
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <FlaskConical className="h-4 w-4 text-amber-600" />
              <Label htmlFor="test-mode" className="text-[10px] font-bold uppercase text-amber-700 cursor-pointer">Test Mode</Label>
              <Switch id="test-mode" checked={testMode} onCheckedChange={setTestMode} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <FileText className="h-4 w-4" /> Transcript Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase">Input Transcript</Label>
                  <Badge variant="outline" className="text-[8px] gap-1 bg-blue-50 text-blue-600 border-blue-200">
                    <Lightbulb className="h-2 w-2" /> Tip: Add "category: history" at the bottom
                  </Badge>
                </div>
                <Textarea 
                  placeholder="Paste your video transcript here..." 
                  className="min-h-[250px] text-xs"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-10" onClick={handleAiGenerate} disabled={isAiGenerating}>
                {isAiGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Step {currentStep}...</> : <><Sparkles className="h-4 w-4 mr-2" /> Run AI Chain</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Layout className="h-4 w-4" /> Global HUD Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedHud} onValueChange={setSelectedHud}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Choose a HUD style..." /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No HUD (Clean)</SelectItem>{huds.map(hud => (<SelectItem key={hud.name} value={hud.name}>{hud.name}</SelectItem>))}</SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={applyHudToScript}
                  title="Apply HUD to current script"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {isAiGenerating && (
            <Card className="border-purple-500/50 bg-purple-500/5">
              <CardContent className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    <span className="font-bold text-purple-700">
                      {currentStep === 0 ? "Step 0: Writing Script..." : currentStep === 1 ? "Step 1: Extracting Topics..." : `Step 2: Structuring Topic ${loopProgress.current}/${loopProgress.total}`}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">AI CHAIN ACTIVE</Badge>
                </div>
                {currentStep === 2 && loopProgress.total > 0 && (
                  <div className="space-y-1.5">
                    <Progress value={(loopProgress.current / loopProgress.total) * 100} className="h-2" />
                    <p className="text-[10px] text-center text-muted-foreground uppercase font-bold">Overall Progress: {Math.round((loopProgress.current / loopProgress.total) * 100)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <Collapsible open={isStep1Open} onOpenChange={setIsStep1Open} className="w-full">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <ListChecks className="h-3 w-3" /> Step 1 Output (Topic List)
                      </CardTitle>
                      {isStep1Open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Textarea value={step1Output} readOnly className="h-[150px] text-[10px] font-mono bg-muted/30 resize-none" placeholder="Topic list will appear here..." />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={isTopicJsonOpen} onOpenChange={setIsTopicJsonOpen} className="w-full">
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <FileJson className="h-3 w-3" /> Final Aggregated JSON
                      </CardTitle>
                      {isTopicJsonOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Textarea value={topicJson} onChange={(e) => setTopicJson(e.target.value)} className="h-[150px] text-[10px] font-mono bg-muted/30 resize-none" placeholder="Final JSON will appear here..." />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50" onClick={() => handleGenerate('intro')} disabled={isGeneratingIntro || isGenerating || isAiGenerating}><LayoutGrid className="h-4 w-4 mr-2" /> Generate Intro Only</Button>
            <Button className={`flex-1 ${testMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`} onClick={() => handleGenerate('full')} disabled={isGenerating || isGeneratingIntro || isAiGenerating}><Sparkles className="h-4 w-4 mr-2" /> Generate Full Script</Button>
          </div>

          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">Final Generated Script</CardTitle>
              <div className="flex items-center gap-2">
                {generatedScript && (
                  <>
                    <Button size="sm" variant="outline" className="h-8 gap-2 text-purple-600 border-purple-200 hover:bg-purple-50" onClick={handleSendToEditor}>
                      <Send className="h-3.5 w-3.5" /> Send to Editor
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(generatedScript); setCopied(true); setTimeout(() => setCopied(false), 2000); showSuccess("Copied!"); }}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {!generatedScript && !isGenerating && !isGeneratingIntro ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg text-center">
                  <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm italic">Your generated script will appear here.</p>
                </div>
              ) : (isGenerating || isGeneratingIntro) ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <Download className="h-12 w-12 mb-4 animate-bounce text-purple-600" />
                  <p className="text-sm font-bold">Building Video Script...</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Searching for media and mapping templates</p>
                  <Button variant="link" size="sm" asChild className="mt-4 text-purple-600 gap-1"><Link to="/dashboard" target="_blank"><ExternalLink className="h-3 w-3" /> View Real-time Logs</Link></Button>
                </div>
              ) : (
                <div className="bg-black rounded-lg p-4 h-[400px] overflow-auto">
                  <pre className="text-green-400 text-[10px] whitespace-pre-wrap font-mono">{generatedScript}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutoGenerator;