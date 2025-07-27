import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/errorHandling"; // Global error handling for DOM exceptions

createRoot(document.getElementById("root")!).render(<App />);
