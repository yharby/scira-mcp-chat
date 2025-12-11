"use client";

import * as React from 'react';
import Map, { Marker, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from "@/lib/utils";
import { MapPin } from 'lucide-react';

interface MapData {
  latitude: number;
  longitude: number;
  zoom?: number;
  title?: string;
  description?: string;
}

interface MapCardProps {
  result: MapData;
}

export function MapCard({ result }: MapCardProps) {
  // Parsing/Defaults
  const lat = Number(result.latitude) || 0;
  const lng = Number(result.longitude) || 0;
  const zoom = Number(result.zoom) || 12;
  
  return (
    <div className={cn(
      "w-full h-[400px] rounded-xl overflow-hidden shadow-lg border border-border/50 relative",
      "bg-secondary/20"
    )}>
       <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: zoom
        }}
        style={{width: '100%', height: '100%'}}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        
      >
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />
        
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="relative flex flex-col items-center">
             <div className="relative z-10 p-2 bg-white rounded-full shadow-md">
                <MapPin className="h-6 w-6 text-primary fill-primary/20" />
             </div>
             <div className="w-1 h-3 bg-primary/50" />
             <div className="w-2 h-1 bg-black/20 rounded-full blur-[1px]" />
             
             {/* Label */}
             {result.title && (
               <div className="absolute -top-10 whitespace-nowrap px-3 py-1.5 bg-background/90 text-foreground text-xs font-medium rounded-lg shadow-sm border border-border/50 backdrop-blur-sm">
                 {result.title}
               </div>
             )}
          </div>
        </Marker>
      </Map>
      
      {/* Overlay Description */}
      {result.description && (
        <div className="absolute bottom-4 left-4 right-14 z-10">
           <div className="bg-background/90 backdrop-blur-md border border-border/50 p-3 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-foreground">{result.description}</p>
           </div>
        </div>
      )}
    </div>
  );
}
