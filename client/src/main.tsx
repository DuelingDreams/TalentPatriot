import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/errorHandler"; // Lightweight error handling for production stability

createRoot(document.getElementById("root")!).render(<App />);
