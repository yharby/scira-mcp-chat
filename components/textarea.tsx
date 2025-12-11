import { useRef, useState, useEffect } from "react";
import { modelID } from "@/ai/providers";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2 } from "lucide-react";
import { ModelPicker } from "./model-picker";

interface InputProps {
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  status: string;
  stop: () => void;
  selectedModel: modelID;
  setSelectedModel: (model: modelID) => void;
  registeredRegions: any[]; // Avoid circular dependency with type import if possible, or import RegisteredRegion
}

export const Textarea = ({
  input,
  handleInputChange,
  isLoading,
  status,
  stop,
  selectedModel,
  setSelectedModel,
  registeredRegions = [],
}: InputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Update suggestions visibility on input change
  useEffect(() => {
    const lastWord = input.split(/[\s\n]+/).pop();
    if (lastWord === '@') {
        setShowSuggestions(true);
    } else if (showSuggestions && !lastWord?.startsWith('@')) {
        setShowSuggestions(false);
    }
  }, [input, showSuggestions]);

  const insertRegion = (region: any) => {
    // Replace the last '@' with the full tag
    const newInput = input.replace(/@$/, '') + `@aoi${region.id} `;
    handleInputChange({ target: { value: newInput } } as any);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <ShadcnTextarea
        className="resize-none bg-background/50 dark:bg-muted/50 backdrop-blur-sm w-full rounded-2xl pr-12 pt-4 pb-24 border-input focus-visible:ring-ring placeholder:text-muted-foreground relative z-10"
        value={input}
        autoFocus
        placeholder="Send a message..."
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isLoading && input.trim()) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
          if (e.key === 'Escape') setShowSuggestions(false);
        }}
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && registeredRegions.length > 0 && (
          <div className="absolute left-2 bottom-16 z-20 bg-popover border border-border shadow-md rounded-xl p-2 flex flex-col gap-1 min-w-[150px] animate-in fade-in slide-in-from-bottom-2">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Suggested Regions</div>
             {registeredRegions.map(region => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => insertRegion(region)}
                  className="text-sm px-2 py-1.5 rounded-md hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground text-left"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: region.color }} />
                  @aoi{region.id}
                </button>
             ))}
          </div>
      )}

      <div className="relative z-20">
       <ModelPicker
        setSelectedModel={setSelectedModel}
        selectedModel={selectedModel}
       />
      </div>

      <button
        type={isStreaming ? "button" : "submit"}
        onClick={isStreaming ? stop : undefined}
        disabled={
          (!isStreaming && !input.trim()) ||
          (isStreaming && status === "submitted")
        }
        className="absolute right-2 bottom-2 rounded-full p-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm z-20"
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
        ) : (
          <ArrowUp className="h-4 w-4 text-primary-foreground" />
        )}
      </button>
    </div>
  );
};
