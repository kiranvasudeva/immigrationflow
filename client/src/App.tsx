import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import WorkerDashboard from "@/pages/worker-dashboard";
import { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug logging
  console.log('Router - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => {
            console.log('Authenticated route - user role:', user?.role);
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
                // Fallback to Owner dashboard if role is undefined or unknown
                console.log('Unknown role, defaulting to ClientDashboard');
                return <ClientDashboard />;
            }
          }} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
