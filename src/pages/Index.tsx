import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Video, PlayCircle, Zap, Scissors, Wand2, Activity, Sparkles, Layout, Film, Box } from "lucide-react";
import { APP_VERSION } from "@/version";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-12 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg">
            <Video className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">REMOTION STUDIO</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
            v{APP_VERSION}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[8px] py-0 px-1 flex items-center gap-1">
            <Zap className="h-2 w-2 fill-current" /> Dynamic Engine
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl w-full">
        {/* AI / MAGIC SECTION */}
        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all border-purple-500/20 bg-purple-500/5 group">
          <Sparkles className="h-10 w-10 mb-4 text-purple-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Magic Generator</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Auto-slice scripts & find media using AI chains.</p>
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
            <Link to="/auto-generator">Open Magic</Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all border-purple-500/20 bg-purple-500/5 group">
          <Wand2 className="h-10 w-10 mb-4 text-purple-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Script Creator</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Build complex videos with simple text commands.</p>
          <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
            <Link to="/script-creator">Open Editor</Link>
          </Button>
        </Card>

        {/* HUD / LAYOUT SECTION */}
        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all border-blue-500/20 bg-blue-500/5 group">
          <Layout className="h-10 w-10 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">HUD Creator</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Design persistent topic overlays and subtitle styles.</p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
            <Link to="/hud-creator">Open HUDs</Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all border-blue-500/20 bg-blue-500/5 group">
          <Scissors className="h-10 w-10 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Final Stitcher</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Precisely cut SV templates into your main timeline.</p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
            <Link to="/final">Open Stitcher</Link>
          </Button>
        </Card>

        {/* CREATORS SECTION */}
        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all group">
          <Video className="h-10 w-10 mb-4 text-slate-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">FV Creator</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Visual editor for main background sequences.</p>
          <Button asChild variant="outline" className="w-full mt-auto">
            <Link to="/video-creator">Open FV</Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all group">
          <Film className="h-10 w-10 mb-4 text-slate-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">SV Creator</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Design reusable dynamic templates with slots.</p>
          <Button asChild variant="outline" className="w-full mt-auto">
            <Link to="/sv-video-creator">Open SV</Link>
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all group">
          <PlayCircle className="h-10 w-10 mb-4 text-slate-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Previewer</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Browse and test base animation templates.</p>
          <Button asChild variant="outline" className="w-full mt-auto">
            <Link to="/remotion-preview">Open Preview</Link>
          </Button>
        </Card>

        {/* SERVER SECTION */}
        <Card className="p-6 flex flex-col items-center text-center hover:shadow-md transition-all border-green-500/20 bg-green-500/5 group">
          <Activity className="h-10 w-10 mb-4 text-green-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Dashboard</h3>
          <p className="text-[11px] text-muted-foreground mb-6 leading-tight">Monitor API traffic, downloads, and render logs.</p>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 mt-auto">
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        </Card>
      </div>

      <div className="mt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm ${className}`}>
    {children}
  </div>
);

export default Index;