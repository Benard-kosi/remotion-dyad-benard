import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RemotionPreview from "./pages/RemotionPreview";
import VideoCreator from "./pages/VideoCreator";
import SVVideoCreator from "./pages/SVVideoCreator";
import Final from "./pages/Final";
import ScriptCreator from "./pages/ScriptCreator";
import ServerDashboard from "./pages/ServerDashboard";
import AutoGenerator from "./pages/AutoGenerator";
import HUDCreator from "./pages/HUDCreator";
import { AppShell } from "./components/AppShell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/remotion-preview" element={<RemotionPreview />} />
              <Route path="/video-creator" element={<VideoCreator />} />
              <Route path="/sv-video-creator" element={<SVVideoCreator />} />
              <Route path="/final" element={<Final />} />
              <Route path="/script-creator" element={<ScriptCreator />} />
              <Route path="/dashboard" element={<ServerDashboard />} />
              <Route path="/auto-generator" element={<AutoGenerator />} />
              <Route path="/hud-creator" element={<HUDCreator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;