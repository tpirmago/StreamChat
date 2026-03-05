import type { ChatMessage as ChatMessageType } from "../types/chat.ts";
import { MarkdownRenderer } from "./MarkdownRenderer.tsx";

export interface MessageBubbleProps {
  message: ChatMessageType;
  streamingContent?: string;
}

export function MessageBubble({ message, streamingContent }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === "user";
  const displayContent = streamingContent ?? message.content;

  return (
    <div className={`message-bubble message-bubble--${message.role}`} data-role={message.role}>
      <div className="message-bubble__content">
        {isUser ? (
          <p className="message-bubble__text">{message.content}</p>
        ) : (
          <MarkdownRenderer content={displayContent} />
        )}
      </div>
    </div>
  );
}
