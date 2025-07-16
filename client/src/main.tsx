import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simplified error handling that doesn't interfere with Vite's development environment
if (import.meta.env.PROD) {
  window.addEventListener('unhandledrejection', (event) => {
    // Handle DOMException and other storage-related errors gracefully in production only
    if (event.reason instanceof DOMException && event.reason.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, cleared some data');
      try {
        localStorage.clear();
      } catch (err) {
        console.warn('Failed to clear localStorage:', err);
      }
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
