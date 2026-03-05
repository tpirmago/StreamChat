# StreamChat

A real-time chat application with streaming LLM responses, persistent history, and Markdown rendering.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the example file and set your Groq API key:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   - `VITE_API_KEY` — **Required.** Your Groq API key.
   - `VITE_API_BASE_URL` — Optional. Default: `https://api.groq.com/openai/v1`.
   - `VITE_MODEL` — Optional. Default: `llama-3.3-70b-versatile`.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open the URL shown in the terminal (e.g. http://localhost:5173).

## LLM choice

- **Provider:** [Groq](https://groq.com)
- **Model:** `llama-3.3-70b-versatile`

Groq was chosen for fast inference and a simple OpenAI-compatible API. The 70B model is suitable for a general-purpose assistant and supports streaming via Server-Sent Events (SSE).

## Architecture

### State management (Zustand)

Zustand is used instead of `useReducer` + `useContext` because:

- No provider wrapper; the store is used directly in hooks.
- Minimal boilerplate and a small API surface.
- Good DevTools support for debugging.
- Fits a single-page chat where one global store is enough.

### Code organization

- **`src/api/`** — LLM provider (Groq SSE client).
- **`src/components/`** — UI: `ChatWindow`, `ChatInput`, `MessageBubble`, `MarkdownRenderer`.
- **`src/hooks/`** — `useChat` (orchestrates store + API + persistence), `useLocalStorage<T>`.
- **`src/store/`** — Zustand chat store (messages, phase).
- **`src/types/`** — Shared TypeScript types and `ChatPhase` discriminated union.

Calls to the LLM are made directly from the browser; there is no backend or proxy.

### Enter key behavior

- **Enter** — Sends the message.
- **Shift+Enter** — Inserts a new line in the input.

## What would be improved with more time

- **Backend proxy** — Move the API key to a server to avoid exposing it in the frontend.
- **E2E tests** — Playwright/Cypress for the full send → stream → history flow.
- **Richer errors** — Differentiate rate limits, auth, and network errors with clearer messages.
- **Conversation list** — Multiple chats with titles and sidebar navigation.

## Known limitations and trade-offs

- **API key in the frontend** — Suitable only for development or demo; production should use a backend.
- **No authentication** — Single-user, local-only.
- **Chat history** — Stored only in `localStorage`; no cloud sync.
- **No attachments** — Text-only; no images or voice input.
