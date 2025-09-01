import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/contexts/I18nProvider";
import { clientErrorReporter } from "@/lib/clientErrorReporter";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import { useAuth } from "@/hooks/useAuth";
import { DummyDataAlert } from "@/components/dummy-data-alert";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useRoleBasedLanguage } from "@/hooks/useRoleBasedLanguage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/sidebar";
import RoleBasedDashboard from "@/components/RoleBasedDashboard";
import TemplatesPage from "@/pages/templates";
import AnalyticsPage from "@/pages/analytics";
import DocumentsPage from "@/pages/documents";
import DeadlinesPage from "@/pages/deadlines";
import ProfilePage from "@/pages/profile";
import ClientProfile from "@/pages/client-profile";
import WorkerProfile from "@/pages/worker-profile";
import SettingsPage from "@/pages/settings";
import AuditLogsPage from "@/pages/audit-logs";
import RequirementsPage from "@/pages/requirements";
import RemindersPage from "@/pages/reminders";
import PaymentsPage from "@/pages/payments";
import WorkersPage from "@/pages/workers";
import ClientsPage from "@/pages/clients";
import WorkflowAssignmentsPage from "@/pages/workflow-assignments";
import HealthCheckPage from "@/pages/health-check";
import { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Initialize role-based language settings
  useRoleBasedLanguage();

  // Initialize client error reporter with user data
  React.useEffect(() => {
    if (user) {
      clientErrorReporter.setUser({
        id: user.id,
        role: user.role
      });
    } else {
      clientErrorReporter.setUser(null);
    }
  }, [user]);


  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div>
      {/* Development role switcher */}
      <RoleSwitcher />
      
      {/* Show dummy data alert for authenticated users */}
      {isAuthenticated && <DummyDataAlert />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <SidebarProvider>
            <AppSidebar userRole={user?.role || 'VIEWER'} />
            <SidebarInset>
              <Switch>
                <Route path="/" component={RoleBasedDashboard} />
                <Route path="/dashboard" component={RoleBasedDashboard} />
                <Route path="/templates" component={TemplatesPage} />
                <Route path="/reports" component={AnalyticsPage} />
                <Route path="/clients" component={ClientsPage} />
                <Route path="/clients/:id" component={ClientProfile} />
                <Route path="/workers" component={WorkersPage} />
                <Route path="/workers/:id" component={WorkerProfile} />
                <Route path="/workflow-assignments" component={WorkflowAssignmentsPage} />
                <Route path="/requirements" component={RequirementsPage} />
                <Route path="/reminders" component={RemindersPage} />
                <Route path="/audit" component={AuditLogsPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/documents" component={DocumentsPage} />
                <Route path="/payments" component={PaymentsPage} />
                <Route path="/deadlines" component={DeadlinesPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/health-check" component={HealthCheckPage} />
                <Route component={NotFound} />
              </Switch>
            </SidebarInset>
          </SidebarProvider>
        )}
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
