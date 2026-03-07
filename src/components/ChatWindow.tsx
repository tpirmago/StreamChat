import { useEffect, useRef } from "react";
import type { ChatMessage, ChatPhase } from "../types/chat.ts";
import { MessageBubble } from "./MessageBubble.tsx";

export interface ChatWindowProps {
  messages: ReadonlyArray<ChatMessage>;
  phase: ChatPhase;
}

function scrollToBottom(el: HTMLElement | null): void {
  if (!el) return;
  const run = (): void => {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  };
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
}

export function ChatWindow({ messages, phase }: ChatWindowProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom(scrollContainerRef.current);
  }, [messages.length, phase]);

  return (
    <div ref={scrollContainerRef} className="chat-window" role="log" aria-live="polite">
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
      <div className="chat-window__sentinel" aria-hidden="true" />
    </div>
  );
}
