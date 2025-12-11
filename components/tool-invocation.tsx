"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  CheckCircle2,
  TerminalSquare,
  Code,
  ArrowRight,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WeatherCard } from "@/components/demos/weather-card";

interface ToolInvocationProps {
  toolName: string;
  state: string;
  args: any;
  result: any;
  isLatestMessage: boolean;
  status: string;
}

export function ToolInvocation({
  toolName,
  state,
  args,
  result,
  isLatestMessage,
  status,
}: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Custom UI Rendering Logic
  if (state === "result" && toolName === "get_weather" && result) {
    let weatherData = result;
    
    // Attempt to extract and parse weather data from standard MCP result structure
    // Structure: { content: [{ type: 'text', text: 'JSON_STRING' }] }
    try {
      if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
          const parsed = JSON.parse(result.content[0].text);
          if (parsed && typeof parsed === 'object') {
            weatherData = parsed;
          }
      } else if (typeof result === 'string') {
          // If result is just a string (some providers might normalize it)
          const parsed = JSON.parse(result);
          if (parsed && typeof parsed === 'object') {
            weatherData = parsed;
          }
      }
    } catch (e) {
      console.error("Failed to parse weather data", e);
      // Fallback: use result as is, WeatherCard will handle missing data gracefully
    }

    return (
      <div className="flex flex-col mb-4">
        {/* Helper text */}
         <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Weather Report
            </span>
         </div>
         
        {/* Render the interactive component */}
        <WeatherCard result={weatherData} />
      </div>
    );
  }

  // Fallback to default rendering
  const getStatusIcon = () => {
    if (state === "call") {
      if (isLatestMessage && status !== "ready") {
        return <Loader2 className="animate-spin h-3.5 w-3.5 text-primary/70" />;
      }
      return (
        <Circle className="h-3.5 w-3.5 fill-muted-foreground/10 text-muted-foreground/70" />
      );
    }
    return <CheckCircle2 size={14} className="text-primary/90" />;
  };

  const getStatusClass = () => {
    if (state === "call") {
      if (isLatestMessage && status !== "ready") {
        return "text-primary";
      }
      return "text-muted-foreground";
    }
    return "text-primary";
  };

  const formatContent = (content: any): string => {
    try {
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      }
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col mb-2 rounded-md border border-border/50 overflow-hidden",
        "bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm",
        "transition-all duration-200 hover:border-border/80 group"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
          "hover:bg-muted/20"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center rounded-full w-5 h-5 bg-primary/5 text-primary">
          <TerminalSquare className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-1">
          <span className="text-foreground font-semibold tracking-tight">
            {toolName}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          <span className={cn("font-medium", getStatusClass())}>
            {state === "call"
              ? isLatestMessage && status !== "ready"
                ? "Running"
                : "Waiting"
              : "Completed"}
          </span>
        </div>
        <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          {getStatusIcon()}
          <div className="bg-muted/30 rounded-full p-0.5 border border-border/30">
            {isExpanded ? (
              <ChevronUpIcon className="h-3 w-3 text-foreground/70" />
            ) : (
              <ChevronDownIcon className="h-3 w-3 text-foreground/70" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 px-3 pb-3">
          {!!args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1.5">
                <Code className="h-3 w-3" />
                <span className="font-medium">Arguments</span>
              </div>
              <pre
                className={cn(
                  "text-xs font-mono p-2.5 rounded-md overflow-x-auto",
                  "border border-border/40 bg-muted/10"
                )}
              >
                {formatContent(args)}
              </pre>
            </div>
          )}

          {!!result && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">Result</span>
              </div>
              <pre
                className={cn(
                  "text-xs font-mono p-2.5 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto",
                  "border border-border/40 bg-muted/10"
                )}
              >
                {formatContent(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
