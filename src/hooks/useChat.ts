// React
import { useCallback, useEffect, useRef } from "react";

// Context / State
import { useChatStore } from "../store/chatStore.ts";

// Services / API
import { createGroqProvider } from "../api/llm.ts";

// Constants / Types
import type { ChatMessage, ChatPhase } from "../types/chat.ts";

const STORAGE_KEY = "streamchat-messages";

function saveMessages(msgs: ReadonlyArray<ChatMessage>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch (err) {
    console.error("Failed to save messages to localStorage:", err);
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export interface UseChatReturn {
  messages: ReadonlyArray<ChatMessage>;
  phase: ChatPhase;
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
  clearHistory: () => void;
  retry: () => void;
}

export function useChat(systemPrompt?: string): UseChatReturn {
  const { messages, phase, setMessages, setPhase, hydrate } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(
          (m): m is ChatMessage =>
            m !== null &&
            typeof m === "object" &&
            "id" in m &&
            "role" in m &&
            "content" in m &&
            "createdAt" in m
        );
        if (valid.length > 0) hydrate(valid);
      }
    } catch (err) {
      console.error("Failed to hydrate messages from localStorage:", err);
    }
  }, [hydrate]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const provider = useRef(createGroqProvider(systemPrompt ?? "You are a helpful assistant."));
  provider.current = createGroqProvider(systemPrompt ?? "You are a helpful assistant.");

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setPhase({ phase: "idle" });
    saveMessages([]);
  }, [setMessages, setPhase]);

  const retry = useCallback(() => {
    setPhase({ phase: "idle" });
  }, [setPhase]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setPhase({ phase: "loading" });

      const controller = new AbortController();
      abortControllerRef.current = controller;
      let fullContent = "";

      try {
        const currentMessages = useChatStore.getState().messages;
        await provider.current.sendMessage({
          messages: [...currentMessages, userMessage],
          onChunk: (chunk) => {
            fullContent += chunk;
            setPhase({ phase: "streaming", partial: fullContent });
          },
          signal: controller.signal,
        });

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPhase({ phase: "idle" });
      } catch (err) {
        if (isAbortError(err)) {
          setPhase({ phase: "idle" });
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setPhase({ phase: "error", message });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [setMessages, setPhase]
  );

  return {
    messages,
    phase,
    sendMessage,
    abort,
    clearHistory,
    retry,
  };
}
