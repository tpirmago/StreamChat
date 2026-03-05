import { useEffect, useRef } from "react";
import type { ChatMessage, ChatPhase } from "../types/chat.ts";
import { MessageBubble } from "./MessageBubble.tsx";

export interface ChatWindowProps {
  messages: ReadonlyArray<ChatMessage>;
  phase: ChatPhase;
}

export function ChatWindow({ messages, phase }: ChatWindowProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, phase]);

  return (
    <div className="chat-window" role="log" aria-live="polite">
      <div className="chat-window__messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {phase.phase === "streaming" && (
          <MessageBubble
            key="streaming"
            message={{
              id: "streaming",
              role: "assistant",
              content: "",
              createdAt: Date.now(),
            }}
            streamingContent={phase.partial}
          />
        )}
      </div>
      <div ref={bottomRef} className="chat-window__sentinel" aria-hidden="true" />
    </div>
  );
}
