// External libraries
import { create } from "zustand";

// Constants / Types
import type { ChatMessage, ChatPhase } from "../types/chat.ts";

const initialPhase: ChatPhase = { phase: "idle" };

interface ChatState {
  messages: ChatMessage[];
  phase: ChatPhase;
  setMessages: (value: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setPhase: (phase: ChatPhase) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  phase: initialPhase,
  setMessages: (value) =>
    set((state) => ({
      messages: typeof value === "function" ? value(state.messages) : value,
    })),
  setPhase: (phase) => set({ phase }),
}));
