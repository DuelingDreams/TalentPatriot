import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Remove global error handlers in development to avoid conflicts with Vite HMR

createRoot(document.getElementById("root")!).render(<App />);
