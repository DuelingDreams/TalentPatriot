import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal app component
function MinimalApp() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TalentPatriot ATS</h1>
        <p className="text-lg text-gray-600">Application is running successfully!</p>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<MinimalApp />);
}
