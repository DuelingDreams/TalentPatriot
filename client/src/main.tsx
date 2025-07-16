import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to prevent unhandled promise rejections from reaching the console
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught:', event.reason);
  event.preventDefault(); // Prevent the default console error
});

window.addEventListener('error', (event) => {
  console.warn('Unhandled error caught:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
