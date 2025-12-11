"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Message, CreateMessage, ChatRequestOptions } from "ai";

export interface RegisteredRegion {
  id: string; // e.g. "#01"
  color: string; // e.g. "#FF0000"
  geometry: any;
}

interface ChatActionsContextType {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setInput: (value: string) => void;
  // Keep activeRegion for immediate "current" selection if needed, or deprecate
  activeRegion: any;
  setActiveRegion: (region: any) => void;
  
  // New Registry
  registeredRegions: RegisteredRegion[];
  registerRegion: (geometry: any) => RegisteredRegion;
}

const ChatActionsContext = createContext<ChatActionsContextType | undefined>(undefined);

export function useChatActions() {
  const context = useContext(ChatActionsContext);
  if (!context) {
    throw new Error("useChatActions must be used within a ChatActionsProvider");
  }
  return context;
}

const REGION_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

interface ChatActionsProviderProps {
  children: React.ReactNode;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setInput: (value: string) => void;
  activeRegion: any;
  setActiveRegion: (region: any) => void;
  registeredRegions: RegisteredRegion[];
  registerRegion: (geometry: any) => RegisteredRegion;
}

export function ChatActionsProvider({ 
    children, 
    append, 
    setInput, 
    activeRegion, 
    setActiveRegion,
    registeredRegions,
    registerRegion 
}: ChatActionsProviderProps) {
  return (
    <ChatActionsContext.Provider value={{ 
      append, 
      setInput, 
      activeRegion, 
      setActiveRegion,
      registeredRegions,
      registerRegion
    }}>
      {children}
    </ChatActionsContext.Provider>
  );
}
