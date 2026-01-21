import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast-setup";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
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
const NotFound = lazy(() => import("@/features/public/pages/NotFound"));
const Dashboard = lazy(() => import("@/features/analytics/pages/Dashboard"));
const Jobs = lazy(() => import("@/features/jobs/pages/Jobs"));
const JobPipeline = lazy(() => import("@/features/jobs/pages/JobPipeline"));
const Clients = lazy(() => import("@/features/organization/pages/Clients"));
const ClientDetail = lazy(() => import("@/features/organization/pages/ClientDetail"));
const Candidates = lazy(() => import("@/features/candidates/pages/Candidates"));
const ProfessionalCandidates = lazy(() => import("@/features/candidates/pages/ProfessionalCandidates"));
const CandidateProfile = lazy(() => import("@/features/candidates/pages/CandidateProfile"));
const Calendar = lazy(() => import("@/features/public/pages/Calendar"));
// Use Google-integrated Messages page with email/calendar features
const Messages = lazy(() => import("@/features/communications/pages/MessagesWithGoogle"));
const Reports = lazy(() => import("@/features/analytics/pages/Reports"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Signup = lazy(() => import("@/features/auth/pages/Signup"));
const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/features/auth/pages/ResetPassword"));
const OnboardingStep1 = lazy(() => import("@/features/onboarding/pages/OnboardingStep1"));
const OnboardingStep2 = lazy(() => import("@/features/onboarding/pages/OnboardingStep2"));
const OnboardingStep3 = lazy(() => import("@/features/onboarding/pages/OnboardingStep3"));
const OnboardingStep4 = lazy(() => import("@/features/onboarding/pages/OnboardingStep4"));
const OnboardingStep5 = lazy(() => import("@/features/onboarding/pages/OnboardingStep5"));
const OnboardingBranding = lazy(() => import("@/features/onboarding/pages/OnboardingBranding"));
const OnboardingReview = lazy(() => import("@/features/onboarding/pages/OnboardingReview"));
const OnboardingChecklist = lazy(() => import("@/features/onboarding/pages/OnboardingChecklist"));
const Unauthorized = lazy(() => import("@/features/public/pages/Unauthorized"));
const Landing = lazy(() => import("@/features/public/pages/Landing"));
const AuthCallback = lazy(() => import("@/features/auth/pages/AuthCallback"));
// Public job posting pages - using correct components
const OrganizationSetup = lazy(() => import("@/features/organization/pages/OrganizationSetup"));
const PrivacyPolicy = lazy(() => import("@/features/public/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/features/public/pages/TermsOfService"));
const Careers = lazy(() => import("@/features/public/pages/Careers"));
const CareersBySlug = lazy(() => import("@/features/public/pages/CareersBySlug"));
const JobApplicationForm = lazy(() => import("@/features/jobs/pages/JobApplicationForm"));
const Health = lazy(() => import("@/features/public/pages/Health"));
const TestFeatures = lazy(() => import("@/features/admin/pages/TestFeatures"));
const Help = lazy(() => import("@/features/public/pages/Help"));
const Documentation = lazy(() => import("@/features/public/pages/Documentation"));
const About = lazy(() => import("@/features/public/pages/About"));
const Pricing = lazy(() => import("@/features/public/pages/Pricing"));
const ProfileSettings = lazy(() => import("@/features/organization/pages/ProfileSettings"));
const AccountSettings = lazy(() => import("@/features/organization/pages/AccountSettings"));
const IntegrationsSettings = lazy(() => import("@/features/settings/pages/IntegrationsSettings"));
const Settings = lazy(() => import("@/features/settings/pages/Settings"));
const OrganizationSettings = lazy(() => import("@/features/settings/pages/OrganizationSettings"));
const BetaProgram = lazy(() => import("@/features/public/pages/BetaProgram"));
const BetaApplicationsAdmin = lazy(() => import("@/features/admin/pages/BetaApplicationsAdmin"));
const AdminInbox = lazy(() => import("@/features/admin/pages/AdminInbox"));
const ResumeParsingDemo = lazy(() => import("@/features/public/pages/ResumeParsingDemo"));
const EmailSettingsAdmin = lazy(() => import("@/features/admin/pages/EmailSettingsAdmin"));
const DataImport = lazy(() => import("@/features/admin/pages/DataImport"));
const DemoTranscript = lazy(() => import("@/features/public/pages/DemoTranscript"));
const CampaignBuilder = lazy(() => import("@/features/communications/pages/CampaignBuilder"));
const RecruitersLanding = lazy(() => import("@/features/public/pages/RecruitersLanding"));
const SmallBusinessLanding = lazy(() => import("@/features/public/pages/SmallBusinessLanding"));
const AgenciesLanding = lazy(() => import("@/features/public/pages/AgenciesLanding"));


// Global error handler for SSL and network issues
function GlobalErrorHandlerSetup() {
  useEffect(() => {
    // Handle only critical chunk load failures that prevent app startup
    const handleChunkLoadError = (event: ErrorEvent) => {
      if (
        event.message.includes('Loading chunk') &&
        event.message.includes('failed')
      ) {
        console.warn('Critical chunk load failure detected, attempting page reload...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    // Handle only SSL certificate errors during initial load
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('ERR_ECDH_FALLBACK_CERTIFICATE_INVALID') ||
        (reason.includes('SSL') && reason.includes('CERT'))
      ) {
        console.warn('SSL certificate error detected, attempting page reload...');
        event.preventDefault();
        setTimeout(() => {
          window.location.reload();
        }, 3000);
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
        <Route path="/onboarding/branding" component={OnboardingBranding} />
        <Route path="/onboarding/review" component={OnboardingReview} />
        <Route path="/onboarding/checklist" component={OnboardingChecklist} />
        <Route path="/unauthorized" component={Unauthorized} />
        <Route path="/about" component={About} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/beta" component={BetaProgram} />
        <Route path="/demo-transcript" component={DemoTranscript} />
        <Route path="/recruiters" component={RecruitersLanding} />
        <Route path="/small-business" component={SmallBusinessLanding} />
        <Route path="/agencies" component={AgenciesLanding} />

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
        <Route path="/demo/resume-parsing" component={ResumeParsingDemo} />
        
        {/* Legacy redirect support */}
        <Route path="/public/careers" component={Careers} />
        <Route path="/public/careers/:slug" component={CareersBySlug} />
        
        {/* Protected routes */}
        <Route path="/settings/organization">
          <ProtectedRoute type="route">
            <OrganizationSettings />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute type="route">
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/jobs">
          <ProtectedRoute type="route">
            <Jobs />
          </ProtectedRoute>
        </Route>
        
        <Route path="/jobs/:id">
          <ProtectedRoute type="route">
            <JobPipeline />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pipeline">
          <ProtectedRoute type="route">
            <JobPipeline />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pipeline/:id">
          <ProtectedRoute type="route">
            <JobPipeline />
          </ProtectedRoute>
        </Route>
        
        <Route path="/clients">
          <ProtectedRoute type="route">
            <Clients />
          </ProtectedRoute>
        </Route>
        
        <Route path="/clients/:id">
          <ProtectedRoute type="route">
            <ClientDetail />
          </ProtectedRoute>
        </Route>
        
        <Route path="/candidates">
          <ProtectedRoute type="route">
            <Candidates />
          </ProtectedRoute>
        </Route>
        
        <Route path="/candidates/:id">
          <ProtectedRoute type="route">
            <CandidateProfile />
          </ProtectedRoute>
        </Route>
        
        <Route path="/calendar">
          <ProtectedRoute type="route">
            <Calendar />
          </ProtectedRoute>
        </Route>
        
        <Route path="/messages">
          <ProtectedRoute type="route">
            <Messages />
          </ProtectedRoute>
        </Route>
        
        <Route path="/campaigns">
          <ProtectedRoute type="route">
            <CampaignBuilder />
          </ProtectedRoute>
        </Route>
        
        <Route path="/reports">
          <ProtectedRoute type="route">
            <Reports />
          </ProtectedRoute>
        </Route>
        
        <Route path="/help">
          <ProtectedRoute type="route">
            <Help />
          </ProtectedRoute>
        </Route>
        
        <Route path="/docs">
          <ProtectedRoute type="route">
            <Documentation />
          </ProtectedRoute>
        </Route>
        
        <Route path="/settings">
          <ProtectedRoute type="route">
            <Settings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/profile-settings">
          <ProtectedRoute type="route">
            <ProfileSettings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/account-settings">
          <ProtectedRoute type="route">
            <AccountSettings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/settings/integrations">
          <ProtectedRoute type="route">
            <IntegrationsSettings />
          </ProtectedRoute>
        </Route>
        
        {/* Feature testing route */}
        <Route path="/test-features">
          <ProtectedRoute type="route">
            <TestFeatures />
          </ProtectedRoute>
        </Route>
        
        {/* Beta applications admin dashboard */}
        <Route path="/admin/beta-applications">
          <ProtectedRoute type="route">
            <BetaApplicationsAdmin />
          </ProtectedRoute>
        </Route>
        
        {/* Admin inbox for approval requests */}
        <Route path="/admin/inbox">
          <ProtectedRoute type="route">
            <AdminInbox />
          </ProtectedRoute>
        </Route>
        
        {/* Email settings admin dashboard */}
        <Route path="/admin/email-settings">
          <ProtectedRoute type="route">
            <EmailSettingsAdmin />
          </ProtectedRoute>
        </Route>
        
        {/* Data import admin dashboard */}
        <Route path="/admin/imports">
          <ProtectedRoute type="route">
            <DataImport />
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
