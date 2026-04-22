"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Copy, Check, ExternalLink, Image as ImageIcon, History, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchResult {
  image: string;
  title: string;
  url: string;
}

const MediaSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("media_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        showError("Search failed");
      }
    } catch (err) {
      showError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = (item: SearchResult) => {
    navigator.clipboard.writeText(item.image);
    setCopiedUrl(item.image);
    showSuccess("URL copied!");
    
    // Add to history
    const newHistory = [item, ...history.filter(h => h.image !== item.image)].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem("media_history", JSON.stringify(newHistory));
    
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("media_history");
    showSuccess("History cleared");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold uppercase tracking-wider">Media Library</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-2">
          <Input 
            placeholder="Search images..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
        </div>

        <Tabs defaultValue="results" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="results" className="text-[10px] uppercase">Results</TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] uppercase">Recent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-3">
              {results.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground text-[10px] italic border-2 border-dashed rounded-lg">
                  Search for assets to use in your video.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {results.map((result, i) => (
                  <MediaCard key={i} item={result} onCopy={() => copyUrl(result)} isCopied={copiedUrl === result.image} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <div className="flex flex-col h-full">
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 text-destructive" onClick={clearHistory}>
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              </div>
              <ScrollArea className="flex-1 pr-3">
                {history.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-[10px] italic border-2 border-dashed rounded-lg">
                    No recently used assets.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {history.map((item, i) => (
                    <MediaCard key={i} item={item} onCopy={() => copyUrl(item)} isCopied={copiedUrl === item.image} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="p-3 bg-muted/30 border-t">
        <p className="text-[9px] text-muted-foreground text-center leading-tight">
          Click an image to copy its URL. You can drag images directly into the Script Editor.
        </p>
      </div>
    </div>
  );
};

const MediaCard = ({ item, onCopy, isCopied }: { item: SearchResult, onCopy: () => void, isCopied: boolean }) => (
  <Card 
    className="overflow-hidden group relative cursor-pointer border-muted hover:border-primary/50 transition-colors"
    onClick={onCopy}
  >
    <div className="aspect-square relative overflow-hidden bg-muted/50">
      <img 
        src={item.image} 
        alt={item.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
        loading="lazy"
        draggable="true"
        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.image)}
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {isCopied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-white" />}
      </div>
    </div>
    <div className="p-1 bg-background">
      <p className="text-[8px] truncate font-medium text-muted-foreground" title={item.title}>
        {item.title}
      </p>
    </div>
  </Card>
);

export default MediaSidebar;