import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CompanyProfile from "@/components/profile/company-profile";
import WorkerList from "@/components/workers/worker-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ClientDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading && user?.role === 'OWNER',
  });

  const clientProfile = clients?.[0]; // Owner should have exactly one client profile

  const { data: workers } = useQuery({
    queryKey: ["/api/clients", clientProfile?.id, "workers"],
    enabled: !!clientProfile?.id,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'OWNER') {
    return null;
  }

  const mockStats = {
    totalWorkers: workers?.length || 0,
    pendingActions: 0, // Would be calculated from assignments
    completed: 0, // Would be calculated from assignments
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="OWNER" />
      
      <div className="ml-64">
        <Header 
          title="Client Dashboard"
          subtitle="Manage your workers and immigration workflows"
          actions={
            <Button data-testid="button-add-worker">
              <i className="fas fa-plus mr-2"></i>Add Worker
            </Button>
          }
        />

        <div className="p-8">
          {/* Company Profile */}
          {clientProfile && <CompanyProfile profile={clientProfile} />}

          {/* Workers Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card data-testid="card-total-workers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Total Workers</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.totalWorkers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-actions-client">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Pending Actions</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.pendingActions}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock text-warning text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-completed-client">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.completed}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workers List */}
          <WorkerList workers={workers || []} />
        </div>
      </div>
    </div>
  );
}
