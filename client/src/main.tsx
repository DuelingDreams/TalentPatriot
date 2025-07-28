import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { Switch, Route, Link } from "wouter";
import "./index.css";

// Step 3: Add routing with Wouter
function StepThreeApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          {/* Simple navigation */}
          <nav className="bg-white shadow p-4">
            <div className="flex gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <Link href="/test" className="text-blue-600 hover:text-blue-800">Test Page</Link>
            </div>
          </nav>
          
          {/* Router content */}
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/test" component={TestPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TalentPatriot ATS</h1>
        <p className="text-lg text-gray-600 mb-4">Step 3: Routing with Wouter</p>
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-green-600">✓ QueryClient loaded successfully</p>
          <p className="text-green-600">✓ UI components working</p>
          <p className="text-green-600">✓ AuthContext loaded successfully</p>
          <p className="text-green-600">✓ Routing working</p>
        </div>
      </div>
    </div>
  );
}

function TestPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-lg text-gray-600">Routing is working correctly!</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Not Found</h1>
        <p className="text-lg text-gray-600">Page not found</p>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<StepThreeApp />);
}
