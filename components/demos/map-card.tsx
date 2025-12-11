"use client";

import * as React from 'react';
import { useCallback, useRef, useEffect } from 'react';
import Map, { NavigationControl, FullscreenControl, useMap } from 'react-map-gl/maplibre';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { cn } from "@/lib/utils";
import { useChatActions } from '@/lib/context/chat-actions-context';
import type { MapRef } from 'react-map-gl/maplibre';

interface MapData {
  latitude: number;
  longitude: number;
  zoom?: number;
  title?: string;
  description?: string;
  geojson?: any; // GeoJSON geometry or feature collection
}

interface MapCardProps {
  result: MapData;
}

export function MapCard({ result }: MapCardProps) {
  const mapRef = useRef<MapRef>(null);
  const { append, setInput, setActiveRegion, registerRegion } = useChatActions();
  const drawRef = useRef<MapboxDraw | null>(null);

  // Parsing/Defaults
  const lat = Number(result.latitude) || 0;
  const lng = Number(result.longitude) || 0;
  const zoom = Number(result.zoom) || 12;

  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Check if draw control already exists to prevent duplicates in strict mode
    if (!drawRef.current) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
        });
        
        map.addControl(draw as any, 'top-left');
        drawRef.current = draw;

        const onDrawCreate = (e: any) => {
            const feature = e.features[0];
            const geometry = feature.geometry; 
            
            // Register region to get ID and Color
            const region = registerRegion(geometry);
            
            setActiveRegion(geometry);
            
            // Set input with the generated ID
            setInput(`@aoi${region.id} `); 
        };

        map.on('draw.create', onDrawCreate);
        // map.on('draw.update', onDrawCreate); // Disable update for ID generation to avoid spamming new IDs
    }

    // Render provided GeoJSON if available
    if (result.geojson) {
      // Remove existing layers source if any
      if (map.getSource('uploaded-geojson')) {
         const source: any = map.getSource('uploaded-geojson');
         source.setData(result.geojson);
      } else {
         map.addSource('uploaded-geojson', {
           type: 'geojson',
           data: result.geojson
         });
         
         // Fill layer
         map.addLayer({
           id: 'uploaded-geojson-fill',
           type: 'fill',
           source: 'uploaded-geojson',
           layout: {},
           paint: {
             'fill-color': '#0080ff',
             'fill-opacity': 0.4
           }
         });
         
         // Line layer
         map.addLayer({
           id: 'uploaded-geojson-line',
           type: 'line',
           source: 'uploaded-geojson',
           layout: {},
           paint: {
             'line-color': '#0080ff',
             'line-width': 2
           }
         });
      }
    }

  }, [append, setActiveRegion, setInput, result.geojson]);

  // Style fix for Mapbox Draw controls to ensure they are clickable over the map
  const drawStyles = `
    .mapboxgl-ctrl-group {
      background-color: white !important;
      box-shadow: 0 0 10px 2px rgba(0,0,0,0.1) !important;
      z-index: 99 !important;
      position: relative !important; /* Ensure it stacks correctly */
    }
    .mapboxgl-ctrl button {
      pointer-events: auto !important; 
    }
  `;

  return (
    <div className={cn(
      "w-full h-[400px] rounded-xl overflow-hidden shadow-lg border border-border/50 relative",
      "bg-secondary/20"
    )}>
       <style>{drawStyles}</style>
       <Map
        ref={mapRef}
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: zoom
        }}
        style={{width: '100%', height: '100%'}}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onLoad={onMapLoad}
      >
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />
      </Map>
      
      {/* Overlay Description */}
      {result.description && (
        <div className="absolute bottom-4 left-4 right-14 z-10 pointer-events-none">
           <div className="bg-background/90 backdrop-blur-md border border-border/50 p-3 rounded-lg shadow-sm pointer-events-auto inline-block">
              <p className="text-sm font-medium text-foreground">{result.description}</p>
           </div>
        </div>
      )}
    </div>
  );
}
