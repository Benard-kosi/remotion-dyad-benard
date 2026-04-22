"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Activity, RefreshCw, Globe, Database, Copy, Terminal, Box, 
  Laptop, Zap, CheckCircle2, Settings, Loader2, Film, Send, ExternalLink, 
  AlertCircle, Download, XCircle, ShieldCheck, ShieldAlert, Scan, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { showSuccess, showError } from "@/utils/toast";
import { APP_VERSION } from "@/version";

interface Log {
  id: number;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  body: string | null;
  isInternal?: boolean;
}

interface RenderTask {
  id: string;
  name: string;
  status: 'rendering' | 'success' | 'failed';
  progress: number;
  startTime: string;
  videoUrl?: string;
  error?: string;
}

interface DownloadTask {
  id: string;
  url: string;
  progress: number;
  size: string;
  status: string;
  isYouTube: boolean;
}

const ServerDashboard = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [renders, setRenders] = useState<RenderTask[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState("");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  
  const verifyUrl = `http://host.docker.internal:3000/verify-script`;
  const renderUrl = `http://host.docker.internal:3000/render-script`;

  const fetchData = async () => {
    try {
      const [logsRes, rendersRes, downloadsRes, settingsRes] = await Promise.all([
        fetch('/api/logs'),
        fetch('/api/renders'),
        fetch('/api/active-downloads'),
        fetch('/api/settings')
      ]);
      
      setLogs(await logsRes.json());
      setRenders(await rendersRes.json());
      setDownloads(await downloadsRes.json());
      const settings = await settingsRes.json();
      if (!webhookUrl) setWebhookUrl(settings.webhookUrl);
      if (!publicBaseUrl) setPublicBaseUrl(settings.publicBaseUrl);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const filterLogs = useMemo(() => {
    return logs.filter(l => l.method === 'FILTER').slice(0, 10);
  }, [logs]);

  const filterStats = useMemo(() => {
    const allFilters = logs.filter(l => l.method === 'FILTER');
    const blocked = allFilters.filter(l => l.status === 403).length;
    const allowed = allFilters.filter(l => l.status === 200).length;
    return { blocked, allowed, total: allFilters.length };
  }, [logs]);

  const skipDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/skip-download/${id}`, { method: 'POST' });
      if (res.ok) {
        showSuccess("Download skipped!");
        fetchData();
      }
    } catch (err) {
      showError("Failed to skip download");
    }
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, publicBaseUrl })
      });
      showSuccess("Settings saved!");
    } catch (err) {
      showError("Failed to save settings");
    }
  };

  const testWebhook = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/test-webhook', { method: 'POST' });
      if (res.ok) showSuccess("Test webhook sent!");
      else showError("Webhook failed (Check logs below)");
    } catch (err) {
      showError("Network error");
    } finally {
      setIsTesting(false);
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
    let interval: any;
    if (isAutoRefresh) {
      interval = setInterval(fetchData, 2000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied!");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 p-2 rounded-lg text-white">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Server Dashboard</h1>
              <div className="flex flex-col">
                <Badge variant="outline" className="font-mono text-[10px]">v{APP_VERSION}</Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[7px] py-0 px-1 mt-0.5 flex items-center gap-0.5">
                  <Zap className="h-2 w-2 fill-current" /> Dynamic Engine
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Manage your n8n automation and monitor renders.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={isAutoRefresh ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            {isAutoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Settings Panel */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">n8n Webhook URL</label>
              <div className="flex gap-2">
                <Input 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)} 
                  placeholder="Must include /webhook-test/ for manual runs"
                  className="h-9 text-xs"
                />
                <Button size="sm" variant="outline" onClick={testWebhook} disabled={isTesting}>
                  {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-[9px] text-amber-600 font-medium">⚠️ Use /webhook-test/ for n8n editor, /webhook/ for Active workflows.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Public Base URL</label>
              <Input 
                value={publicBaseUrl} 
                onChange={(e) => setPublicBaseUrl(e.target.value)} 
                placeholder="https://your-tunnel.ngrok-free.app"
                className="h-9 text-xs"
              />
              <p className="text-[9px] text-muted-foreground italic">Required for n8n to download the video file.</p>
            </div>

            <Button className="w-full h-9" onClick={saveSettings}>Save All Settings</Button>

            <div className="pt-4 border-t space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase">1. Verify Endpoint</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-[10px] font-mono truncate">{verifyUrl}</code>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(verifyUrl)}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase">2. Render Endpoint</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-[10px] font-mono truncate">{renderUrl}</code>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(renderUrl)}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Filter Activity */}
        <Card className="lg:col-span-7 border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <Scan className="h-4 w-4" /> Media Filter Activity
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[8px]">{filterStats.allowed} Allowed</Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[8px]">{filterStats.blocked} Blocked</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filterLogs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground italic text-xs border-2 border-dashed rounded-lg border-blue-200">
                  No media filtering activity yet.
                </div>
              )}
              {filterLogs.map((log) => (
                <div key={log.id} className={`flex flex-col p-2.5 rounded-lg border bg-card shadow-sm gap-1.5 ${log.status === 403 ? 'border-destructive/30' : 'border-green-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {log.status === 403 ? (
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono truncate max-w-[350px]">{log.url}</span>
                    </div>
                    <Badge variant={log.status === 403 ? 'destructive' : 'default'} className="text-[8px] h-4 px-1">
                      {log.status === 403 ? 'BLOCKED' : 'ALLOWED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-muted-foreground font-medium">{log.body}</span>
                    <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {filterLogs.length > 0 && (
              <p className="text-[8px] text-center mt-4 text-muted-foreground uppercase font-bold tracking-wider">
                Self-Healing Engine Active • Scanning for Human/3D Faces
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Downloads Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Active Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {downloads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground italic text-xs border-2 border-dashed rounded-lg">
                No active downloads.
              </div>
            )}
            {downloads.map((dl) => (
              <div key={dl.id} className="flex flex-col p-3 rounded-lg border bg-card gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold truncate max-w-[400px]">{dl.url}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] h-4">{dl.isYouTube ? 'YOUTUBE' : 'DIRECT'}</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono">Size: {dl.size}</span>
                        <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">{dl.status}...</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="h-7 text-[9px] gap-1"
                    onClick={() => skipDownload(dl.id)}
                  >
                    <XCircle className="h-3 w-3" /> SKIP
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Renders Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Film className="h-4 w-4" /> Active Renders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground italic text-xs border-2 border-dashed rounded-lg">
                No active render tasks.
              </div>
            )}
            {renders.map((render) => (
              <div key={render.id} className="flex flex-col p-3 rounded-lg border bg-card gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {render.status === 'rendering' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : render.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold truncate max-w-[200px]">{render.name}</span>
                      <span className="text-[9px] text-muted-foreground">{new Date(render.startTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {render.status === 'success' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(render.videoUrl || "")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    <Badge variant={render.status === 'rendering' ? 'secondary' : render.status === 'success' ? 'default' : 'destructive'} className="text-[9px] uppercase">
                      {render.status}
                    </Badge>
                  </div>
                </div>
                
                {render.status === 'rendering' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold uppercase">
                      <span>Progress</span>
                      <span>{render.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={render.progress} className="h-1.5" />
                  </div>
                )}

                {render.error && (
                  <div className="mt-1 p-2 bg-destructive/5 border border-destructive/20 rounded text-[9px] font-mono text-destructive whitespace-pre-wrap break-all max-h-[150px] overflow-y-auto">
                    <p className="font-bold mb-1 uppercase">Error Log:</p>
                    {render.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">HTTP Traffic Log</CardTitle>
          <Badge variant="outline" className="text-[9px]">Last 50 Requests</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 && <div className="text-center py-8 text-muted-foreground italic text-xs">No traffic recorded.</div>}
            {logs.map((log) => (
              <div key={log.id} className={`flex flex-col p-2 rounded border text-[10px] ${log.isInternal ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-accent/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Badge variant={log.isInternal ? "secondary" : "outline"} className="w-16 justify-center text-[8px]">
                      {log.isInternal ? 'OUTGOING' : log.method}
                    </Badge>
                    <span className="font-mono truncate max-w-[400px]">{log.url}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <Badge className={log.status >= 400 ? "bg-destructive" : "bg-green-500"}>{log.status}</Badge>
                  </div>
                </div>
                {log.body && (
                  <div className="mt-1.5 p-1.5 bg-muted/50 rounded text-[9px] font-mono text-muted-foreground break-all">
                    {log.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerDashboard;