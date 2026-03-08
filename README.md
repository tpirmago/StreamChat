# StreamChat

A minimal, streaming AI chat application built with React, TypeScript, and Zustand. Responses are streamed token-by-token in real time using Groq's OpenAI-compatible API.

---

## Features

- Real-time token streaming via Server-Sent Events (SSE)
- Markdown rendering with syntax highlighting
- Chat history survives page refreshes
- Stop/abort an in-flight response at any time
- Responsive layout for mobile and desktop
- No backend required — runs entirely in the browser

---

## Setup

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and set the following:

| Variable | Required | Description |
|---|---|---|
| `VITE_API_KEY` | **Yes** | Your Groq API key (get one at [console.groq.com](https://console.groq.com)) |
| `VITE_API_BASE_URL` | No | API base URL. Defaults to `https://api.groq.com/openai/v1` |
| `VITE_MODEL` | No | Model ID to use. Defaults to `llama-3.3-70b-versatile` |


### 4. Start the development server

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`).

### 5. Run tests

```bash
npm test
```

---

## Project Structure

```
src/
├── api/          # LLM provider: fetch, SSE parsing, streaming
├── components/   # UI components (ChatInput, ChatWindow, MessageBubble, MarkdownRenderer)
├── hooks/        # Custom React hooks (useChat, useLocalStorage, useMediaQuery)
├── store/        # Zustand global state (chatStore)
└── types/        # Shared TypeScript types and interfaces
```

---

## Design Decisions

### Assistant role

The assistant is configured as a **universal, general-purpose assistant** with the system prompt `"You are a helpful assistant."` This makes the app broadly useful across coding, writing, research, and everyday questions without locking it to a specific domain. The system prompt is defined as a constant in `App.tsx`.

---

### LLM provider: Groq + `llama-3.3-70b-versatile`

**Groq** was chosen for two reasons:

1. **Speed.** Groq delivers inference at hundreds of tokens per second. This makes streaming feel real-time.
2. **OpenAI-compatible API.** Groq exposes the same `/chat/completions` endpoint and SSE streaming format as OpenAI, so the integration code is straightforward and the provider can be swapped out later.

**`llama-3.3-70b-versatile`** was selected because it is one of the strongest openly available models capable across coding, reasoning, and general conversation. It is available on Groq's free tier, making it ideal for development and demos.

---

### State management: Zustand

Zustand was chosen over React Context + `useReducer` (or heavier alternatives like Redux) for several reasons:

- **Minimal boilerplate.** The entire chat store is defined in ~25 lines with no providers, reducers, or action creators.
- **Direct store access outside React.** `useChatStore.getState()` lets `useChat` read the latest message list synchronously in the middle of an async operation. This avoids stale closure bugs when constructing the message payload for each API call — a problem that would require `useRef` workarounds with plain `useState`.
- **Selector-based subscriptions.** Components only re-render when the slice of state they subscribe to actually changes, avoiding unnecessary re-renders during high-frequency streaming updates.
- **Small bundle size.** Zustand adds under 2 KB gzipped, which is appropriate for a client-only app with no server to compensate.

---

### Architectural decisions

The codebase is split into four layers, each with a single responsibility:

| Layer | Purpose |
|---|---|
| `api/` | All network concerns. `llm.ts` handles the `fetch` call, SSE parsing, and chunk streaming. It exposes a `LLMProvider` interface, keeping the rest of the app decoupled from any specific API shape — swapping Groq for another provider only requires changing this file. |
| `store/` | Global reactive state (messages, chat phase) via Zustand. Holds no business logic — only state and setters. |
| `hooks/` | Bridge between the store, the API, and the UI. `useChat` orchestrates the full send → stream → persist lifecycle, including abort, retry, and error handling. `useLocalStorage` and `useMediaQuery` are generic utility hooks. |
| `components/` | Presentational React components. They receive props and fire callbacks; they do not touch the store or the API directly. |
| `types/` | Shared TypeScript types (`ChatMessage`, `ChatPhase`, `LLMProvider`, etc.). Centralising types prevents circular imports and makes refactoring safe across the whole codebase. |

This separation means the streaming logic, the state layer, and the UI can each be tested and changed independently.

**Keyboard behavior in the input:**
- `Enter` — sends the message
- `Shift+Enter` — inserts a newline

---

## Known Limitations and Trade-offs

**API key stored on the frontend**
`VITE_API_KEY` is bundled into the client-side JavaScript at build time. Anyone who loads the page can extract it from the network tab or the build output. This is acceptable for local development and private deployments, but is a security risk for any publicly hosted instance.

**No backend proxy**
All requests go directly from the browser to the Groq API. There is no server-side layer to hide the key, rate-limit requests, add guardrails, or log usage.

**No multi-chat support**
The app maintains a single linear conversation. There is no concept of multiple chats, conversation titles, or a sidebar for switching between sessions.

**No cloud storage**
Chat history is saved to `localStorage`, which is browser-local. Clearing browser data, opening a different browser, or switching devices starts with an empty history. There is no sync or backup.

**No user authentication**
There is no login or account system.

---

## What Could Be Improved 

- **Backend proxy** — Moving the API key to a server-side proxy would eliminate the frontend key exposure problem and enable request logging, rate limiting, and caching.
- **Multi-chat support** — A sidebar with named, independently stored conversations would make the app significantly more useful for ongoing work.
- **Cloud persistence** — Syncing history to a database would allow access across devices and survive browser data clears.
- **Better error differentiation** — The current error state shows a generic message and a retry button. Distinguishing rate-limit errors, auth failures, and network errors would help users self-diagnose and recover faster.
- **E2E tests** — Tests for the full flow (send → stream → history) would give higher confidence than unit tests alone.
