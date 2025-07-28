import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppErrorBoundary } from "@/utils/appErrorBoundary";

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load all pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobPipeline = lazy(() => import("@/pages/JobPipeline"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const ProfessionalCandidates = lazy(() => import("@/pages/ProfessionalCandidates"));
const CandidateProfile = lazy(() => import("@/pages/CandidateProfile"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Messages = lazy(() => import("@/pages/Messages"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const OnboardingStep1 = lazy(() => import("@/pages/OnboardingStep1"));
const OnboardingStep2 = lazy(() => import("@/pages/OnboardingStep2"));
const OnboardingStep3 = lazy(() => import("@/pages/OnboardingStep3"));
const OnboardingStep4 = lazy(() => import("@/pages/OnboardingStep4"));
const OnboardingStep5 = lazy(() => import("@/pages/OnboardingStep5"));
const OnboardingChecklist = lazy(() => import("@/pages/OnboardingChecklist"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const Landing = lazy(() => import("@/pages/Landing"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/onboarding/step1" component={OnboardingStep1} />
        <Route path="/onboarding/step2" component={OnboardingStep2} />
        <Route path="/onboarding/step3" component={OnboardingStep3} />
        <Route path="/onboarding/step4" component={OnboardingStep4} />
        <Route path="/onboarding/step5" component={OnboardingStep5} />
        <Route path="/onboarding/checklist" component={OnboardingChecklist} />
        <Route path="/unauthorized" component={Unauthorized} />
        
        {/* Protected routes */}
        <Route path="/dashboard">
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
        
        <Route path="/pipeline/:id">
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
            <ProfessionalCandidates />
          </ProtectedRoute>
        </Route>
        
        <Route path="/candidates/:id">
          <ProtectedRoute>
            <CandidateProfile />
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
    </Suspense>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
