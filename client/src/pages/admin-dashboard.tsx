import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import WorkflowKanban from "@/components/kanban/workflow-kanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: auditLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/audit"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard/assignments"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
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

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const stats = dashboardStats || {
    totalClients: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    pendingActions: 0,
    completedThisMonth: 0,
    assignmentsByStatus: {},
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="ADMIN" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.admin.title') || "Admin Dashboard"}
          subtitle={t('dashboard.admin.subtitle') || "Global workflow management and oversight"}
          actions={
            <div className="flex items-center space-x-4">
              <Input 
                placeholder={t('common.searchPlaceholder') || 'Search clients, workers, CUI...'} 
                className="w-80"
                data-testid="input-global-search"
              />
              <Button data-testid="button-new-client">
                <i className="fas fa-plus mr-2"></i>{t('action.newClient') || 'New Client'}
              </Button>
            </div>
          }
        />

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-clients">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.totalClients') || 'Total Clients'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-arrow-up mr-1"></i>New clients
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-building text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-active-workers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.activeWorkers') || 'Active Workers'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeWorkers}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-arrow-up mr-1"></i>Active cases
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-actions">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.pendingActions') || 'Pending Actions'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingActions}</p>
                    <p className="text-sm text-warning">
                      <i className="fas fa-clock mr-1"></i>Needs attention
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-warning text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-completed-month">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.completedThisMonth') || 'Completed This Month'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedThisMonth}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-check mr-1"></i>This month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Kanban */}
          <Card className="mb-8" data-testid="card-workflow-overview">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>{t('common.workflowOverview') || 'Workflow Overview'}</CardTitle>
                <div className="flex items-center space-x-3">
                  <Select>
                    <SelectTrigger className="w-32" data-testid="select-stage-filter">
                      <SelectValue placeholder={t('common.allStages') || 'All Stages'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="ajofm">AJOFM</SelectItem>
                      <SelectItem value="work-permit">Work Permit</SelectItem>
                      <SelectItem value="visa">Visa D/AM</SelectItem>
                      <SelectItem value="residence">Residence Permit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" data-testid="button-filter">
                    <i className="fas fa-filter"></i>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <WorkflowKanban assignments={assignments} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                    <p className="text-secondary">No recent activity</p>
                  </div>
                ) : (
                  auditLogs.slice(0, 5).map((log: any, index: number) => (
                    <div key={log.id || index} className="flex items-start space-x-4" data-testid={`activity-${index}`}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-info text-primary text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.action}</p>
                        <p className="text-xs text-secondary mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
