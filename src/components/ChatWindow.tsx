// React
import { useCallback, useEffect, useRef } from "react";

// Components
import { MessageBubble } from "./MessageBubble.tsx";

// Constants / Types
import type { ChatMessage, ChatPhase } from "../types/chat.ts";

// Styles
import "./ChatWindow.css";

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

    function handleNewMessage(container: HTMLDivElement): void {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        container.scrollTop = container.scrollHeight;
        shouldFollowRef.current = true;
      }
    }

    function handleStreamingStart(container: HTMLDivElement): void {
      const el = streamingRef.current;
      if (el) {
        const elTop = el.getBoundingClientRect().top;
        const cTop = container.getBoundingClientRect().top;
        container.scrollTop += elTop - cTop;
      }
      shouldFollowRef.current = true;
    }

    function handleStreamingChunk(container: HTMLDivElement): void {
      if (!shouldFollowRef.current) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > container.scrollTop) {
        container.scrollTop = maxScroll;
      }
    }

    if (newMessageAdded) {
      handleNewMessage(c);
      return;
    }
    if (streamingJustStarted) {
      handleStreamingStart(c);
      return;
    }
    if (phase.phase === "streaming") {
      handleStreamingChunk(c);
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
                createdAt: 0,
              }}
              streamingContent={phase.partial}
            />
          </div>
        )}
      </div>
    </div>
  );
}
