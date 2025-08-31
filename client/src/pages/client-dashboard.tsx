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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import WorkflowProgressTracker from "@/components/WorkflowProgressTracker";

export default function ClientDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading && user?.role === 'OWNER',
  });

  const clientProfile = clients[0]; // Owner should have exactly one client profile

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", clientProfile?.id, "workers"],
    enabled: !!clientProfile?.id,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
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

  const realStats = {
    totalWorkers: workers?.length || 0,
    pendingActions: 0, // TODO: Calculate from assignments when assignments API is available
    completed: 0, // TODO: Calculate from assignments when assignments API is available
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="OWNER" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.client.title') || "Client Dashboard"}
          subtitle={t('dashboard.client.subtitle') || "Manage your workers and immigration workflows"}
          actions={
            <Button data-testid="button-add-worker">
              <i className="fas fa-plus mr-2"></i>{t('action.addWorker') || 'Add Worker'}
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
                    <p className="text-sm text-secondary">{t('dashboard.stats.totalWorkers') || 'Total Workers'}</p>
                    <p className="text-3xl font-bold text-gray-900">{realStats.totalWorkers}</p>
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
                    <p className="text-sm text-secondary">{t('dashboard.stats.pendingActions') || 'Pending Actions'}</p>
                    <p className="text-3xl font-bold text-gray-900">{realStats.pendingActions}</p>
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
                    <p className="text-sm text-secondary">{t('dashboard.stats.completed') || 'Completed'}</p>
                    <p className="text-3xl font-bold text-gray-900">{realStats.completed}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="workers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workers" data-testid="tab-workers">
                {t('dashboard.tabs.workers') || 'Workers'}
              </TabsTrigger>
              <TabsTrigger value="workflows" data-testid="tab-workflows">
                {t('dashboard.tabs.workflows') || 'Workflow Progress'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workers" className="space-y-4">
              <WorkerList workers={workers || []} />
            </TabsContent>

            <TabsContent value="workflows" className="space-y-4">
              {workers.length > 0 ? (
                <div className="space-y-6">
                  {workers.map((worker) => (
                    <div key={worker.id} className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {worker.firstName} {worker.lastName}
                        {worker.position && <span className="text-sm text-muted-foreground ml-2">({worker.position})</span>}
                      </h3>
                      <WorkflowProgressTracker 
                        workerId={worker.id}
                        userRole={user?.role || 'OWNER'}
                        showUploadPane={true}
                        showVerificationToggles={true}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <p>{t('dashboard.noWorkers') || 'No workers found'}</p>
                      <p className="text-sm">{t('dashboard.addWorkersFirst') || 'Add workers to track their workflow progress'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
