import type { UIMessage as TMessage } from "ai";
import { Message } from "./message";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

export const Messages = ({
  messages,
  isLoading,
  status,
}: {
  messages: TMessage[];
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
}) => {
  const [containerRef, endRef] = useScrollToBottom();

  return (
    <div className="h-full overflow-y-auto no-scrollbar" ref={containerRef}>
      <div className="max-w-lg sm:max-w-3xl mx-auto py-4">
      <div className="max-w-lg sm:max-w-3xl mx-auto py-4">
        {(() => {
          let mapCounter = 0;
          return messages.map((m, i) => {
            const mapsInMessage = m.parts?.filter(
              (p) =>
                p.type === "tool-invocation" &&
                p.toolInvocation.toolName === "show_on_map"
            ).length || 0;
            
            const startIndex = mapCounter; // 0-based start index for this message
            mapCounter += mapsInMessage;

            return (
              <Message
                key={i}
                isLatestMessage={i === messages.length - 1}
                isLoading={isLoading}
                message={m}
                status={status}
                mapStartIndex={startIndex}
              />
            );
          });
        })()}
        <div className="h-1" ref={endRef} />
      </div>
      </div>
    </div>
  );
};
