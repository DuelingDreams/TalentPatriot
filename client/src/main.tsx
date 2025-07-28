import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";

// Step 1: Add QueryClient and basic UI components
function StepOneApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TalentPatriot ATS</h1>
          <p className="text-lg text-gray-600 mb-4">Step 1: QueryClient + UI Components</p>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-green-600">✓ QueryClient loaded successfully</p>
            <p className="text-green-600">✓ UI components working</p>
          </div>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<StepOneApp />);
}
