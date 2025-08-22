import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast-setup";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppErrorBoundary } from "@/utils/appErrorBoundary";
import { DemoToggleFooter } from "@/components/DemoToggleFooter";
import { supabase } from "@/lib/supabase";

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
const Candidates = lazy(() => import("@/pages/Candidates"));
const ProfessionalCandidates = lazy(() => import("@/pages/ProfessionalCandidates"));
const CandidateProfile = lazy(() => import("@/pages/CandidateProfile"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Messages = lazy(() => import("@/pages/Messages"));
const Reports = lazy(() => import("@/pages/Reports"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const OnboardingStep1 = lazy(() => import("@/pages/OnboardingStep1"));
const OnboardingStep2 = lazy(() => import("@/pages/OnboardingStep2"));
const OnboardingStep3 = lazy(() => import("@/pages/OnboardingStep3"));
const OnboardingStep4 = lazy(() => import("@/pages/OnboardingStep4"));
const OnboardingStep5 = lazy(() => import("@/pages/OnboardingStep5"));
const OnboardingChecklist = lazy(() => import("@/pages/OnboardingChecklist"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const Landing = lazy(() => import("@/pages/Landing"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
// Public job posting pages - using correct components
const OrganizationSetup = lazy(() => import("@/pages/OrganizationSetup"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Careers = lazy(() => import("@/pages/Careers"));
const CareersBySlug = lazy(() => import("@/pages/CareersBySlug"));
const JobApplicationForm = lazy(() => import("@/pages/JobApplicationForm"));
const Health = lazy(() => import("@/pages/health"));
const TestFeatures = lazy(() => import("@/pages/TestFeatures"));

function Router() {
  const [location, setLocation] = useLocation();
  
  // Handle OAuth callbacks that arrive as hash parameters
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we have an access_token in the hash
      if (window.location.hash && window.location.hash.includes('access_token')) {
        // Let Supabase handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          // Redirect to our auth callback handler
          setLocation('/auth/callback');
        }
      }
    };
    
    handleOAuthCallback();
  }, [setLocation]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/onboarding/step1" component={OnboardingStep1} />
        <Route path="/onboarding/step2" component={OnboardingStep2} />
        <Route path="/onboarding/step3" component={OnboardingStep3} />
        <Route path="/onboarding/step4" component={OnboardingStep4} />
        <Route path="/onboarding/step5" component={OnboardingStep5} />
        <Route path="/onboarding/checklist" component={OnboardingChecklist} />
        <Route path="/unauthorized" component={Unauthorized} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/health" component={Health} />
        {/* Public careers pages - Multiple routing approaches */}
        <Route path="/careers" component={Careers} />
        <Route path="/careers/:slug" component={CareersBySlug} />
        <Route path="/careers/:slug/apply" component={JobApplicationForm} />
        
        {/* Organization-specific careers pages (path-based routing) */}
        <Route path="/org/:orgSlug/careers" component={Careers} />
        <Route path="/org/:orgSlug/careers/:slug" component={CareersBySlug} />
        <Route path="/org/:orgSlug/careers/:slug/apply" component={JobApplicationForm} />
        
        {/* Demo and test routes */}
        <Route path="/demo/resume-parsing" component={lazy(() => import('./pages/ResumeParsingDemo'))} />
        
        {/* Legacy redirect support */}
        <Route path="/public/careers" component={Careers} />
        <Route path="/public/careers/:slug" component={CareersBySlug} />
        
        {/* Protected routes */}
        <Route path="/settings/organization">
          <ProtectedRoute>
            <OrganizationSetup />
          </ProtectedRoute>
        </Route>
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
            <Candidates />
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
        
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        
        {/* Feature testing route */}
        <Route path="/test-features">
          <ProtectedRoute>
            <TestFeatures />
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
            <ToastProvider />
            <Router />
            <DemoToggleFooter />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
