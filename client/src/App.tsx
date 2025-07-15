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
import RoleManagement from "@/pages/RoleManagement";
import MyAssignments from "@/pages/MyAssignments";
import InterviewSchedule from "@/pages/InterviewSchedule";
import Analytics from "@/pages/Analytics";
import ClientReports from "@/pages/ClientReports";
import BusinessMetrics from "@/pages/BusinessMetrics";
import LeadPipeline from "@/pages/LeadPipeline";
import Projects from "@/pages/Projects";
import ContractJobs from "@/pages/ContractJobs";
import ResourcePlanning from "@/pages/ResourcePlanning";
import SystemSettings from "@/pages/SystemSettings";
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
      
      {/* Recruiter-specific routes */}
      <Route path="/pipeline">
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <JobPipeline />
        </ProtectedRoute>
      </Route>
      
      <Route path="/assignments">
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <MyAssignments />
        </ProtectedRoute>
      </Route>
      
      <Route path="/interviews">
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <InterviewSchedule />
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <Analytics />
        </ProtectedRoute>
      </Route>
      
      {/* BD-specific routes */}
      <Route path="/reports/clients">
        <ProtectedRoute allowedRoles={['bd', 'admin']}>
          <ClientReports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/metrics">
        <ProtectedRoute allowedRoles={['bd', 'admin']}>
          <BusinessMetrics />
        </ProtectedRoute>
      </Route>
      
      <Route path="/leads">
        <ProtectedRoute allowedRoles={['bd', 'admin']}>
          <LeadPipeline />
        </ProtectedRoute>
      </Route>
      
      {/* PM-specific routes */}
      <Route path="/projects">
        <ProtectedRoute allowedRoles={['pm', 'admin']}>
          <Projects />
        </ProtectedRoute>
      </Route>
      
      <Route path="/contracts">
        <ProtectedRoute allowedRoles={['pm', 'admin']}>
          <ContractJobs />
        </ProtectedRoute>
      </Route>
      
      <Route path="/resources">
        <ProtectedRoute allowedRoles={['pm', 'admin']}>
          <ResourcePlanning />
        </ProtectedRoute>
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin/roles">
        <ProtectedRoute requiredRole="admin">
          <RoleManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/settings">
        <ProtectedRoute requiredRole="admin">
          <SystemSettings />
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
