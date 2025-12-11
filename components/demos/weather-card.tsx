"use client";

import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
}

interface WeatherCardProps {
  result: WeatherData;
}

export function WeatherCard({ result }: WeatherCardProps) {
  // Determine icon based on condition
  const getIcon = (condition: string = 'Sunny') => {
    const c = (condition || 'Sunny').toLowerCase();
    if (c.includes("rain")) return <CloudRain className="h-12 w-12 text-blue-400" />;
    if (c.includes("cloud")) return <Cloud className="h-12 w-12 text-gray-400" />;
    if (c.includes("wind")) return <Wind className="h-12 w-12 text-gray-400" />;
    return <Sun className="h-12 w-12 text-amber-500" />;
  };

  // Determine background gradient based on condition
  const getBackground = (condition: string = 'Sunny') => {
    const c = (condition || 'Sunny').toLowerCase();
    if (c.includes("rain")) return "from-slate-800 to-slate-900";
    if (c.includes("cloud")) return "from-gray-800 to-gray-900";
    if (c.includes("sunny") || c.includes("clear")) return "from-blue-400 to-blue-600";
    return "from-indigo-500 to-purple-600";
  };

  return (
    <div className={cn(
      "w-full max-w-[300px] rounded-xl overflow-hidden shadow-lg border border-border/50",
      "text-white bg-gradient-to-br",
      getBackground(result?.condition)
    )}>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{result?.location || 'Unknown Location'}</h2>
            <p className="text-white/80 text-sm font-medium mt-1 uppercase tracking-wider">{result?.condition || 'Unknown'}</p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            {getIcon(result?.condition)}
          </div>
        </div>

        <div className="mt-8 flex items-baseline">
          <span className="text-5xl font-bold">{Math.round(result?.temperature || 0)}°</span>
          <span className="text-xl font-normal text-white/80 ml-1">C</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <Droplets className="h-4 w-4 text-blue-200" />
            <div>
              <p className="text-[10px] text-white/60 uppercase font-bold">Humidity</p>
              <p className="text-sm font-medium">{result?.humidity || 50}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <Wind className="h-4 w-4 text-gray-200" />
            <div>
              <p className="text-[10px] text-white/60 uppercase font-bold">Wind</p>
              <p className="text-sm font-medium">{result?.windSpeed || 10} km/h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
