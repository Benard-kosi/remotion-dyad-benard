"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Wand2, FileText, Layout, PlayCircle, Video, Activity, 
  Home, ChevronRight, Menu, Sparkles, Film, Settings, Scissors,
  Image as ImageIcon, Search
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "./made-with-dyad";
import GlobalStatusBar from "./GlobalStatusBar";
import MediaSidebar from "./MediaSidebar";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Magic Generator", url: "/auto-generator", icon: Sparkles, color: "text-purple-600" },
  { title: "Script Creator", url: "/script-creator", icon: Wand2, color: "text-purple-600" },
  { title: "HUD Creator", url: "/hud-creator", icon: Layout, color: "text-blue-600" },
  { title: "Final Stitcher", url: "/final", icon: Scissors, color: "text-blue-600" },
  { title: "FV Creator", url: "/video-creator", icon: Video, color: "text-slate-600" },
  { title: "SV Creator", url: "/sv-video-creator", icon: Film, color: "text-slate-600" },
  { title: "Dashboard", url: "/dashboard", icon: Activity, color: "text-green-600" },
  { title: "Previewer", url: "/remotion-preview", icon: PlayCircle, color: "text-slate-600" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background pb-14">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b px-4 py-2">
            <div className="flex items-center gap-2 font-bold">
              <div className="bg-primary text-primary-foreground p-1 rounded">
                <Video className="h-4 w-4" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden">Remotion Studio</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon className={item.color} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-2">
            <div className="group-data-[collapsible=icon]:hidden">
              <MadeWithDyad />
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-auto relative">
          <div className="flex h-12 items-center justify-between border-b px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger className="-ml-1 mr-4" />
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span>Remotion Studio</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">
                  {navItems.find(item => item.url === location.pathname)?.title || "Page"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant={isMediaOpen ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2 text-[10px] font-bold uppercase"
                onClick={() => setIsMediaOpen(!isMediaOpen)}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Media Library
              </Button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        <MediaSidebar isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} />
        <GlobalStatusBar />
      </div>
    </SidebarProvider>
  );
}