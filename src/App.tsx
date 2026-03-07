import { useChat } from "./hooks/useChat.ts";
import "./App.css";
import { ChatInput } from "./components/ChatInput.tsx";
import { ChatWindow } from "./components/ChatWindow.tsx";

const SYSTEM_PROMPT = "You are a helpful assistant.";

function App(): React.ReactElement {
  const { messages, phase, sendMessage, abort, clearHistory, retry } = useChat(
    SYSTEM_PROMPT
  );

  const isLoading = phase.phase === "loading";

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">StreamChat</h1>
        <button
          type="button"
          className="app__new-chat"
          onClick={clearHistory}
          aria-label="Start new chat"
        >
          New chat
        </button>
      </header>
      <main className="app__main">
        <ChatWindow messages={messages} phase={phase} />
        <footer className="app__footer">
          {isLoading && (
            <div className="app__loading" role="status" aria-live="polite">
              <span className="app__loading-dot" />
              <span className="app__loading-dot" />
              <span className="app__loading-dot" />
            </div>
          )}
          <ChatInput
            phase={phase}
            onSend={sendMessage}
            onStop={abort}
            onRetry={retry}
          />
        </footer>
      </main>
    </div>
  );
}

export default App;
