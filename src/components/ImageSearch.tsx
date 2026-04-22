"use client";

import React, { useState } from "react";
import { Search, Loader2, Copy, Check, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SearchResult {
  image: string;
  title: string;
  url: string;
}

const ImageSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showSuccess("URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" /> Search Images
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> DuckDuckGo Image Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mt-4">
          <Input 
            placeholder="Search for images (e.g. 'cyberpunk city', 'cute cat')..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-6 pr-2">
          {results.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-lg">
              Enter a query to find images for your video.
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map((result, i) => (
              <Card key={i} className="overflow-hidden group relative bg-muted/30">
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={result.image} 
                    alt={result.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8"
                      onClick={() => copyUrl(result.image)}
                    >
                      {copiedUrl === result.image ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={result.image} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] truncate font-medium text-muted-foreground" title={result.title}>
                    {result.title}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSearch;