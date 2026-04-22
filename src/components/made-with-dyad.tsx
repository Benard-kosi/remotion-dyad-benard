import { APP_VERSION } from "@/version";

export const MadeWithDyad = () => {
  return (
    <div className="p-4 text-center flex flex-col items-center gap-1">
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Made with Dyad
      </a>
      <span className="text-[10px] text-muted-foreground font-mono">Build v{APP_VERSION}</span>
    </div>
  );
};