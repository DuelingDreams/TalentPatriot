import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/domExceptionHandler"; // Lightweight DOM exception prevention

createRoot(document.getElementById("root")!).render(<App />);
