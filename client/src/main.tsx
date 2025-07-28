import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// import "./utils/domExceptionHandler"; // Temporarily disabled to fix app crash

createRoot(document.getElementById("root")!).render(<App />);
