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
import AppShell from "./AppShell";

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
const Help = lazy(() => import("@/pages/Help"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const About = lazy(() => import("@/pages/About"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const ProfileSettings = lazy(() => import("@/pages/ProfileSettings"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const BetaProgram = lazy(() => import("@/pages/BetaProgram"));

function AppPrefetch() {
  useEffect(() => {
    // Prefetch high-traffic pages to reduce chunk fetch failures
    // Add retry logic for SSL certificate issues
    const prefetchWithRetry = async (modulePath: string, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await import(modulePath);
          break;
        } catch (error) {
          if (i === retries - 1) {
            console.warn(`Failed to prefetch ${modulePath} after ${retries} attempts:`, error);
          } else {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
    };

    prefetchWithRetry("@/pages/Dashboard");
    prefetchWithRetry("@/pages/Jobs");
    prefetchWithRetry("@/pages/Candidates");
    prefetchWithRetry("@/pages/Clients");
    prefetchWithRetry("@/pages/Reports");
  }, []);
  return null;
}

// Global error handler for SSL and network issues
function GlobalErrorHandlerSetup() {
  useEffect(() => {
    // Handle chunk load failures (common with SSL issues)
    const handleChunkLoadError = (event: ErrorEvent) => {
      if (
        event.message.includes('Loading chunk') ||
        event.message.includes('SSL') ||
        event.message.includes('ERR_SSL') ||
        event.message.includes('ERR_CERT') ||
        event.message.includes('ERR_ECDH_FALLBACK_CERTIFICATE_INVALID')
      ) {
        console.warn('SSL/Certificate error detected, attempting page reload...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Handle unhandled promise rejections (like SSL fetch errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('SSL') ||
        reason.includes('ERR_SSL') ||
        reason.includes('ERR_CERT') ||
        reason.includes('certificate')
      ) {
        console.warn('SSL promise rejection detected, attempting page reload...');
        event.preventDefault();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener('error', handleChunkLoadError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkLoadError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return null;
}

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
        <Route path="/about" component={About} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/beta" component={BetaProgram} />

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
        
        <Route path="/help">
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        </Route>
        
        <Route path="/docs">
          <ProtectedRoute>
            <Documentation />
          </ProtectedRoute>
        </Route>
        
        <Route path="/profile-settings">
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/account-settings">
          <ProtectedRoute>
            <AccountSettings />
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
            <GlobalErrorHandlerSetup />
            <Toaster />
            <ToastProvider />
            <AppShell>
              <AppPrefetch />
              <Router />
              <DemoToggleFooter />
            </AppShell>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
