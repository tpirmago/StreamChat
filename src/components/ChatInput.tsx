import { useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery.ts";
import type { ChatPhase } from "../types/chat.ts";

const PLACEHOLDER_MOBILE = "Type a message...";
const PLACEHOLDER_DESKTOP = "Type a message... (Enter to send)";

export interface ChatInputProps {
  phase: ChatPhase;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  phase,
  onSend,
  onStop,
  onRetry,
  disabled = false,
  placeholder,
}: ChatInputProps): React.ReactElement {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const resolvedPlaceholder =
    placeholder ?? (isDesktop ? PLACEHOLDER_DESKTOP : PLACEHOLDER_MOBILE);

  const [inputValue, setInputValue] = useState("");

  const isStreaming = phase.phase === "loading" || phase.phase === "streaming";
  const isError = phase.phase === "error";

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input">
      {isError && (
        <div className="chat-input__error" role="alert">
          <span className="chat-input__error-text">{phase.message}</span>
          <button
            type="button"
            className="chat-input__retry"
            onClick={onRetry}
            aria-label="Retry"
          >
            Retry
          </button>
        </div>
      )}
      <div className="chat-input__row">
        <textarea
          className="chat-input__field"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          disabled={disabled || isStreaming}
          rows={1}
          aria-label="Message input"
        />
        {isStreaming ? (
          <button
            type="button"
            className="chat-input__btn chat-input__btn--stop"
            onClick={onStop}
            aria-label="Stop generating"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="chat-input__btn chat-input__btn--send"
            onClick={handleSubmit}
            disabled={disabled || !inputValue.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        )}
      </div>
      <p className="chat-input__hint">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
