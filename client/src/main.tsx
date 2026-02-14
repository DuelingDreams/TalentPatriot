import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./bootstrap";
import "./utils/errorHandler"; // Import error handler to initialize it
import { ErrorBoundary } from "./components/ErrorBoundary";

window.addEventListener("error", (e: ErrorEvent) => {
  const m = String((e?.error as any)?.message ?? e?.message ?? "");
  if (/(Loading chunk|ChunkLoadError|dynamically imported)/i.test(m)) {
    const key = "__tp_chunk_reload";
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (!last || now - Number(last) > 10_000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
});

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
}
