import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/fixRuntimeError";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
