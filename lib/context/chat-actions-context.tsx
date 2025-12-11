"use client";

import { createContext, useContext } from "react";
import type { Message, CreateMessage, ChatRequestOptions } from "ai";

interface ChatActionsContextType {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setInput: (value: string) => void;
  activeRegion: any;
  setActiveRegion: (region: any) => void;
}

const ChatActionsContext = createContext<ChatActionsContextType | undefined>(undefined);

export function useChatActions() {
  const context = useContext(ChatActionsContext);
  if (!context) {
    throw new Error("useChatActions must be used within a ChatActionsProvider");
  }
  return context;
}

interface ChatActionsProviderProps {
  children: React.ReactNode;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setInput: (value: string) => void;
  activeRegion: any;
  setActiveRegion: (region: any) => void;
}

export function ChatActionsProvider({ children, append, setInput, activeRegion, setActiveRegion }: ChatActionsProviderProps) {
  return (
    <ChatActionsContext.Provider value={{ append, setInput, activeRegion, setActiveRegion }}>
      {children}
    </ChatActionsContext.Provider>
  );
}
