import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage, ChatPhase } from "../types/chat.ts";
import { MessageBubble } from "./MessageBubble.tsx";

export interface ChatWindowProps {
  messages: ReadonlyArray<ChatMessage>;
  phase: ChatPhase;
}

export function ChatWindow({ messages, phase }: ChatWindowProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const streamingRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef(messages.length);
  const prevPhaseRef = useRef(phase.phase);
  const shouldFollowRef = useRef(true);

  const handleScroll = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    shouldFollowRef.current = distanceFromBottom < 80;
  }, []);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;

    const prevLength = prevLengthRef.current;
    const prevPhase = prevPhaseRef.current;
    prevLengthRef.current = messages.length;
    prevPhaseRef.current = phase.phase;

    const newMessageAdded = messages.length > prevLength;
    const streamingJustStarted = prevPhase !== "streaming" && phase.phase === "streaming";

    // A new completed message was added to the list
    if (newMessageAdded) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        // Scroll to bottom so user sees their own sent message
        c.scrollTop = c.scrollHeight;
        shouldFollowRef.current = true;
      }
      return;
    }

    // Streaming just started: scroll to show the beginning of the reply
    if (streamingJustStarted) {
      const el = streamingRef.current;
      if (el) {
        const elTop = el.getBoundingClientRect().top;
        const cTop = c.getBoundingClientRect().top;
        c.scrollTop += elTop - cTop;
      }
      shouldFollowRef.current = true;
      return;
    }

    // Streaming chunk: only scroll if new content grew below the visible area
    if (phase.phase === "streaming" && shouldFollowRef.current) {
      const maxScroll = c.scrollHeight - c.clientHeight;
      if (maxScroll > c.scrollTop) {
        c.scrollTop = maxScroll;
      }
    }
  }, [messages, phase]);

  return (
    <div
      ref={scrollRef}
      className="chat-window"
      role="log"
      aria-live="polite"
      onScroll={handleScroll}
    >
      <div className="chat-window__messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble-wrapper message-bubble-wrapper--${msg.role}`}>
            <MessageBubble message={msg} />
          </div>
        ))}
        {phase.phase === "streaming" && (
          <div ref={streamingRef} className="message-bubble-wrapper message-bubble-wrapper--assistant">
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: "",
                createdAt: Date.now(),
              }}
              streamingContent={phase.partial}
            />
          </div>
        )}
      </div>
    </div>
  );
}
