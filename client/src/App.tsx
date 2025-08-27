import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/contexts/I18nProvider";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import { useAuth } from "@/hooks/useAuth";
import { DummyDataAlert } from "@/components/dummy-data-alert";
import { useRoleBasedLanguage } from "@/hooks/useRoleBasedLanguage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import WorkerDashboard from "@/pages/worker-dashboard";
import TemplatesPage from "@/pages/templates";
import AnalyticsPage from "@/pages/analytics";
import DocumentsPage from "@/pages/documents";
import DeadlinesPage from "@/pages/deadlines";
import ProfilePage from "@/pages/profile";
import ClientProfile from "@/pages/client-profile";
import { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Initialize role-based language settings
  useRoleBasedLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug logging (remove in production)
  // console.log('Router - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <div>
      {/* Show dummy data alert for authenticated users */}
      {isAuthenticated && <DummyDataAlert />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
        <>
          <Route path="/" component={() => {
            switch (user?.role) {
              case 'ADMIN':
                return <AdminDashboard />;
              case 'OWNER':
                return <ClientDashboard />;
              case 'WORKER':
                return <WorkerDashboard />;
              case 'VIEWER':
                return <AdminDashboard />;
              default:
                return <ClientDashboard />;
            }
          }} />
          <Route path="/dashboard" component={() => {
            switch (user?.role) {
              case 'ADMIN':
                return <AdminDashboard />;
              case 'OWNER':
                return <ClientDashboard />;
              case 'WORKER':
                return <WorkerDashboard />;
              case 'VIEWER':
                return <AdminDashboard />;
              default:
                return <ClientDashboard />;
            }
          }} />
          <Route path="/templates" component={TemplatesPage} />
          <Route path="/reports" component={() => <AdminDashboard />} />
          <Route path="/clients" component={() => <AdminDashboard />} />
          <Route path="/clients/:id" component={ClientProfile} />
          <Route path="/workers" component={() => <AdminDashboard />} />
          <Route path="/requirements" component={() => <AdminDashboard />} />
          <Route path="/reminders" component={() => <AdminDashboard />} />
          <Route path="/audit" component={() => <AdminDashboard />} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/documents" component={DocumentsPage} />
          <Route path="/payments" component={() => <ClientDashboard />} />
          <Route path="/deadlines" component={DeadlinesPage} />
        </>
      )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BreadcrumbProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BreadcrumbProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
