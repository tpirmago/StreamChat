import type { ChatMessage, LLMProvider, SendMessageOptions } from "../types/chat.ts";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChunkChoice {
  delta?: { content?: string };
  finish_reason?: string | null;
}

interface GroqChunk {
  choices?: GroqChunkChoice[];
}

function getConfig(): { baseUrl: string; model: string; apiKey: string } {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("VITE_API_KEY is not set");
  }
  const baseUrl =
    typeof import.meta.env.VITE_API_BASE_URL === "string" &&
    import.meta.env.VITE_API_BASE_URL.trim() !== ""
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
      : DEFAULT_BASE_URL;
  const model =
    typeof import.meta.env.VITE_MODEL === "string" &&
    import.meta.env.VITE_MODEL.trim() !== ""
      ? import.meta.env.VITE_MODEL
      : DEFAULT_MODEL;
  return { baseUrl, model, apiKey };
}

/**
 * Parses SSE line and returns content from a Groq-style chunk, or null if not a content chunk.
 * Exported for unit testing.
 */
export function parseSSEDataLine(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed === "data: [DONE]") return null;
  if (!trimmed.startsWith("data: ")) return null;
  const jsonStr = trimmed.slice(6);
  try {
    const chunk: GroqChunk = JSON.parse(jsonStr) as GroqChunk;
    const content = chunk.choices?.[0]?.delta?.content;
    return typeof content === "string" ? content : null;
  } catch {
    return null;
  }
}

async function streamSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    if (signal.aborted) return;
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const content = parseSSEDataLine(line);
      if (content) onChunk(content);
    }
  }
  for (const line of buffer.split("\n")) {
    const content = parseSSEDataLine(line);
    if (content) onChunk(content);
  }
}

function toGroqMessages(
  systemPrompt: string,
  messages: ReadonlyArray<ChatMessage>
): GroqMessage[] {
  const groq: GroqMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];
  for (const m of messages) {
    groq.push({
      role: m.role,
      content: m.content,
    });
  }
  return groq;
}

export function createGroqProvider(systemPrompt: string = "You are a helpful assistant."): LLMProvider {
  return {
    async sendMessage(options: SendMessageOptions): Promise<void> {
      const { baseUrl, model, apiKey } = getConfig();
      const body = {
        model,
        messages: toGroqMessages(systemPrompt, options.messages),
        stream: true,
        max_tokens: 1024,
      };
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const bodyStream = res.body;
      if (!bodyStream) throw new Error("No response body");
      const reader = bodyStream.getReader();
      await streamSSE(reader, options.onChunk, options.signal);
    },
  };
}
