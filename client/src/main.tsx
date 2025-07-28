import { createRoot } from "react-dom/client";

// Import DOM exception prevention FIRST - before any other code
import "./utils/domExceptionPrevention";
import "./utils/errorHandler"; // Lightweight error handling for production stability

import App from "./App";
import "./index.css";

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
