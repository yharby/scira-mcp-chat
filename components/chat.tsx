"use client";


import { defaultModel, type modelID } from "@/ai/providers";
import { Message, useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Textarea } from "./textarea";
import { ProjectOverview } from "./project-overview";
import { Messages } from "./messages";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convertToUIMessages } from "@/lib/chat-utils";
import { type Message as DBMessage } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { useMCP } from "@/lib/context/mcp-context";
import { ChatActionsProvider } from "@/lib/context/chat-actions-context";

// Type for chat data from DB
interface ChatData {
  id: string;
  messages: DBMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function Chat() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const queryClient = useQueryClient();
  
  const [selectedModel, setSelectedModel] = useLocalStorage<modelID>("selectedModel", defaultModel);
  const [userId, setUserId] = useState<string>('');
  const [generatedChatId, setGeneratedChatId] = useState<string>('');
  
  // Get MCP server data from context
  const { mcpServersForApi } = useMCP();
  
  // Initialize userId
  useEffect(() => {
    setUserId(getUserId());
  }, []);
  
  // Generate a chat ID if needed
  useEffect(() => {
    if (!chatId) {
      setGeneratedChatId(nanoid());
    }
  }, [chatId]);
  
  // Use React Query to fetch chat history
  const { data: chatData, isLoading: isLoadingChat, error } = useQuery({
    queryKey: ['chat', chatId, userId] as const,
    queryFn: async ({ queryKey }) => {
      const [_, chatId, userId] = queryKey;
      if (!chatId || !userId) return null;
      
      const response = await fetch(`/api/chats/${chatId}`, {
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        // For 404, return empty chat data instead of throwing
        if (response.status === 404) {
          return { id: chatId, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        }
        throw new Error('Failed to load chat');
      }
      
      return response.json() as Promise<ChatData>;
    },
    enabled: !!chatId && !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Handle query errors
  useEffect(() => {
    if (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    }
  }, [error]);
  
  // Prepare initial messages from query data
  const initialMessages = useMemo(() => {
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      return [];
    }
    
    // Convert DB messages to UI format, then ensure it matches the Message type from @ai-sdk/react
    const uiMessages = convertToUIMessages(chatData.messages);
    return uiMessages.map(msg => ({
      id: msg.id,
      role: msg.role as Message['role'], // Ensure role is properly typed
      content: msg.content,
      parts: msg.parts,
    } as Message));
  }, [chatData]);
  
  const { messages, input, handleInputChange, handleSubmit, status, stop, append } =
    useChat({
      id: chatId || generatedChatId, // Use generated ID if no chatId in URL
      initialMessages,
      maxSteps: 20,
      body: {
        selectedModel,
        mcpServers: mcpServersForApi,
        chatId: chatId || generatedChatId, // Use generated ID if no chatId in URL
        userId,
      },
      experimental_throttle: 100,
      onFinish: () => {
        // Invalidate the chats query to refresh the sidebar
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ['chats', userId] });
        }
      },
      onError: (error) => {
        toast.error(
          error.message.length > 0
            ? error.message
            : "An error occured, please try again later.",
          { position: "top-center", richColors: true },
        );
      },
    });
    
  // State for map interactions
  const [activeRegion, setActiveRegion] = useState<any>(null);
  const [registeredRegions, setRegisteredRegions] = useState<any[]>([]);
  const regionIdCounter = useRef(0);

  const REGION_COLORS = [
      "#EF4444", // Red
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#3B82F6", // Blue
      "#8B5CF6", // Violet
      "#EC4899", // Pink
  ];

  // Restore regions and counter from message history
  useEffect(() => {
    if (messages.length === 0) return;

    const restoredRegions: any[] = [];
    let maxId = 0;

    messages.forEach(m => {
      if (m.role === 'user') {
         const idMatch = m.content.match(/@aoi#(\d+)/);
         const contextMatch = m.content.match(/<context>\s*User selected region:\s*(\{[\s\S]*?\})\s*<\/context>/);
         
         if (idMatch && contextMatch) {
            const idNum = parseInt(idMatch[1], 10);
            if (idNum > maxId) maxId = idNum;
            
            try {
                const geometry = JSON.parse(contextMatch[1]);
                const regionId = `#${idMatch[1]}`;
                
                // Avoid duplicates in local list
                if (!restoredRegions.find(r => r.id === regionId)) {
                    restoredRegions.push({
                        id: regionId,
                        color: REGION_COLORS[(idNum - 1) % REGION_COLORS.length],
                        geometry
                    });
                }
            } catch (e) {
                // Ignore parse errors
            }
         }
      }
    });

    if (restoredRegions.length > 0) {
       setRegisteredRegions(prev => {
           const existingIds = new Set(prev.map(r => r.id));
           const novel = restoredRegions.filter(r => !existingIds.has(r.id));
           if (novel.length === 0) return prev;
           return [...prev, ...novel];
       });
       
       if (maxId > regionIdCounter.current) {
           regionIdCounter.current = maxId;
       }
    }
  }, [messages]);

  const registerRegion = useCallback((geometry: any) => {
    // Increment counter safely
    regionIdCounter.current += 1;
    const nextIdNum = regionIdCounter.current;
    
    const id = `#${nextIdNum.toString().padStart(2, '0')}`;
    const color = REGION_COLORS[(nextIdNum - 1) % REGION_COLORS.length];
    
    const newRegion = {
      id,
      color,
      geometry
    };
    
    setRegisteredRegions(prev => [...prev, newRegion]);
    return newRegion; 
  }, []); // Stable callback, no dependencies needed thanks to ref and functional update

  // Custom submit handler
  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!chatId && generatedChatId && input.trim()) {
      // If this is a new conversation, redirect to the chat page with the generated ID
      const effectiveChatId = generatedChatId;
      
      // Check if we need to inject context
      let content = input;
      if (activeRegion && (content.includes('@aoi') || content.includes('@AOI'))) {
          const regionStr = JSON.stringify(activeRegion);
          content = `${content}\n\n<context>\nUser selected region: ${regionStr}\n</context>`;
          setActiveRegion(null); // Clear after use
      }

      // We need to manually append if we modified content, or if we want to ensure redirection happens correctly 
      // with the new chatId.
      
      // Optimized flow: always use append for potentially complex logic, or just let handleSubmit work if standard.
      // But since we want to modify content, we must use append.
      append({
          role: 'user',
          content: content
      }, {
          body: { chatId: effectiveChatId }
      });
      
      // Update URL without navigation if possible, or push
      window.history.replaceState(null, '', `/chat/${effectiveChatId}`);
      // Actually the original logic was probably relying on the backend to create the chat or just pushing the router.
      // Let's stick to the router.push pattern if that was there, or just rely on the fact that we are starting a chat.
      router.push(`/chat/${effectiveChatId}`);
      
      return;
    }
    
    // Existing chat
    if (activeRegion && (input.includes('@aoi') || input.includes('@AOI'))) {
          const regionStr = JSON.stringify(activeRegion);
          const content = `${input}\n\n<context>\nUser selected region: ${regionStr}\n</context>`;
          append({
              role: 'user',
              content: content
          });
          setActiveRegion(null);
          // Manually clear input since append doesn't automatically clear the controlled input if we call it directly?
          // Actually useChat's append usually adds the message. 
          // We need to clear the input state manually if we bypass handleSubmit.
          handleInputChange({ target: { value: '' } } as any);
          return;
    }

    handleSubmit(e);
  }, [chatId, generatedChatId, input, handleSubmit, router, append, activeRegion, handleInputChange]);

  const isLoading = status === "streaming" || status === "submitted" || isLoadingChat;

  const setInputWrapper = useCallback((value: string) => {
    handleInputChange({ target: { value } } as any);
  }, [handleInputChange]);

  return (
    <ChatActionsProvider 
      append={append} 
      setInput={setInputWrapper}
      activeRegion={activeRegion}
      setActiveRegion={setActiveRegion}
      registeredRegions={registeredRegions}
      registerRegion={registerRegion}
    >
      <div className="h-dvh flex flex-col justify-center w-full max-w-[430px] sm:max-w-3xl mx-auto px-4 sm:px-6 py-3">
        {messages.length === 0 && !isLoadingChat ? (
          <div className="max-w-xl mx-auto w-full">
            <ProjectOverview />
            <form
              onSubmit={handleFormSubmit}
              className="mt-4 w-full mx-auto"
            >
              <Textarea
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                handleInputChange={handleInputChange}
                input={input}
                isLoading={isLoading}
                status={status}
                stop={stop}
                registeredRegions={registeredRegions}
              />
            </form>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
              <Messages messages={messages} isLoading={isLoading} status={status} />
            </div>
            <form
              onSubmit={handleFormSubmit}
              className="mt-2 w-full mx-auto"
            >
              <Textarea
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                handleInputChange={handleInputChange}
                input={input}
                isLoading={isLoading}
                status={status}
                stop={stop}
                registeredRegions={registeredRegions}
              />
            </form>
          </>
        )}
      </div>
    </ChatActionsProvider>
  );
}
