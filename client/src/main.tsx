import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./bootstrap";
import "./utils/errorHandler"; // Import error handler to initialize it
import { ErrorBoundary } from "./components/ErrorBoundary";

// Auto-reload on chunk load errors (once per session)
let __tpReloadedForChunkError = false;

window.addEventListener("error", (e: ErrorEvent) => {
  const m = String((e?.error as any)?.message ?? e?.message ?? "");
  // Covers: "Loading chunk", "ChunkLoadError", "Failed to fetch dynamically imported module"
  if (!__tpReloadedForChunkError && /(Loading chunk|ChunkLoadError|dynamically imported)/i.test(m)) {
    __tpReloadedForChunkError = true;
    setTimeout(() => window.location.reload(), 75);
  }
});

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
}
