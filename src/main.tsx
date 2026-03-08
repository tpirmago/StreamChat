// React
import { StrictMode } from "react";

// External libraries
import { createRoot } from "react-dom/client";

// Components
import App from "./App.tsx";

// Styles
import "highlight.js/styles/atom-one-dark.css";
import "./index.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
