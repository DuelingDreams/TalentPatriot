import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/errorHandler"; // Lightweight error handling for production stability

// Wrap app initialization in try-catch to handle any startup errors
try {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<App />);
  } else {
    console.error("Root element not found");
  }
} catch (error) {
  console.error("Failed to initialize app:", error);
}
