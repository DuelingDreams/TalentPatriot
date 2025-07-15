import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import JobPipeline from "@/pages/JobPipeline";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Candidates from "@/pages/Users";
import Calendar from "@/pages/Calendar";
import Messages from "@/pages/Messages";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Unauthorized from "@/pages/Unauthorized";
// Demo components removed - using authenticated demo account instead

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/unauthorized" component={Unauthorized} />
      
      {/* Demo routes */}
      {/* Demo routes no longer needed since we use authenticated demo account */}
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/jobs">
        <ProtectedRoute>
          <Jobs />
        </ProtectedRoute>
      </Route>
      
      <Route path="/jobs/:id">
        <ProtectedRoute>
          <JobPipeline />
        </ProtectedRoute>
      </Route>
      
      <Route path="/pipeline">
        <ProtectedRoute>
          <JobPipeline />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients/:id">
        <ProtectedRoute>
          <ClientDetail />
        </ProtectedRoute>
      </Route>
      
      <Route path="/candidates">
        <ProtectedRoute>
          <Candidates />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calendar">
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      </Route>
      
      <Route path="/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
