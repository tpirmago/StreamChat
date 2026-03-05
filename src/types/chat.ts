export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface SendMessageOptions {
  messages: ReadonlyArray<ChatMessage>;
  onChunk: (text: string) => void;
  signal: AbortSignal;
}

export type ChatPhase =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "streaming"; partial: string }
  | { phase: "error"; message: string };

export interface LLMProvider {
  sendMessage(options: SendMessageOptions): Promise<void>;
}
