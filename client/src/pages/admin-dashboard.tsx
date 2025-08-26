import { useEffect, useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
  // Collapsible states
  const [clientsOpen, setClientsOpen] = useState(true);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  
  // Filter states
  const [clientFilter, setClientFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Navigation states
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState(false);

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
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole="ADMIN" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={t('dashboard.admin.title') || "Admin Dashboard"}
          subtitle={t('dashboard.admin.subtitle') || "Global workflow management and oversight"}
          actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Input 
                placeholder={t('common.searchPlaceholder') || 'Search clients, workers, CUI...'} 
                className="w-full sm:w-80"
                data-testid="input-global-search"
              />
              <Button data-testid="button-new-client" className="shrink-0">
                <i className="fas fa-plus mr-2"></i>{t('action.newClient') || 'New Client'}
              </Button>
            </div>
          }
        />

        <div className="p-4 lg:p-8 max-w-full overflow-x-hidden">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card data-testid="card-total-clients">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.totalClients') || 'Total Clients'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-arrow-up mr-1"></i>{t('dashboard.stats.newClients') || 'New clients'}
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
                      <i className="fas fa-arrow-up mr-1"></i>{t('dashboard.stats.activeCases') || 'Active cases'}
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
                      <i className="fas fa-clock mr-1"></i>{t('dashboard.stats.needsAttention') || 'Needs attention'}
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
                      <i className="fas fa-check mr-1"></i>{t('dashboard.stats.thisMonth') || 'This month'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Clients Section */}
          <Collapsible open={clientsOpen} onOpenChange={setClientsOpen} className="mb-6">
            <Card data-testid="card-clients-overview">
              <CardHeader className="border-b border-gray-200">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center">
                      <i className="fas fa-building mr-2"></i>
                      {t('common.clients') || 'Clients Overview'}
                    </CardTitle>
                    {clientsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('common.filters') || 'Filters'}:</span>
                    </div>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-client-filter">
                        <SelectValue placeholder={t('common.allClients') || 'All Clients'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allClients') || 'All Clients'}</SelectItem>
                        <SelectItem value="active">{t('common.activeClients') || 'Active Clients'}</SelectItem>
                        <SelectItem value="inactive">{t('common.inactiveClients') || 'Inactive Clients'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                        <SelectValue placeholder={t('common.allStatuses') || 'All Statuses'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allStatuses') || 'All Statuses'}</SelectItem>
                        <SelectItem value="pending">{t('common.pending') || 'Pending'}</SelectItem>
                        <SelectItem value="approved">{t('common.approved') || 'Approved'}</SelectItem>
                        <SelectItem value="processing">{t('common.processing') || 'Processing'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Navigation Breadcrumb */}
                  {selectedClient && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedClient(null);
                            setEditingClient(false);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <i className="fas fa-arrow-left mr-2"></i>
                          {t('common.clients') || 'Clients'}
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">{selectedClient.companyName}</span>
                      </div>
                      <Button
                        variant={editingClient ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingClient(!editingClient)}
                        data-testid="button-edit-client"
                      >
                        <i className={`fas ${editingClient ? 'fa-save' : 'fa-edit'} mr-2`}></i>
                        {editingClient ? (t('actions.save') || 'Save') : (t('actions.edit') || 'Edit')}
                      </Button>
                    </div>
                  )}

                  {/* Client List View */}
                  {!selectedClient && (
                    <div className="space-y-4">
                      {clients.map((client: any, index: number) => (
                        <div 
                          key={client.id || index} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                          onClick={() => setSelectedClient(client)}
                          data-testid={`client-${index}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-building text-primary"></i>
                            </div>
                            <div>
                              <p className="font-medium">{client.companyName}</p>
                              <p className="text-sm text-secondary">CUI: {client.cui}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{client.activeWorkers || 0} workers</p>
                            <p className="text-xs text-secondary">{client.status}</p>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Client Profile View */}
                  {selectedClient && (
                    <div className="space-y-6">
                      {/* Client Profile Header */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-building text-white text-xl"></i>
                            </div>
                            <div className="flex-1">
                              {editingClient ? (
                                <div className="space-y-4">
                                  <Input
                                    defaultValue={selectedClient.companyName}
                                    className="text-xl font-bold bg-white"
                                    placeholder={t('common.companyName') || 'Company Name'}
                                    data-testid="input-company-name"
                                  />
                                  <Input
                                    defaultValue={selectedClient.cui}
                                    className="bg-white"
                                    placeholder={t('common.cui') || 'CUI'}
                                    data-testid="input-cui"
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                      defaultValue={selectedClient.address || ''}
                                      className="bg-white"
                                      placeholder={t('common.address') || 'Address'}
                                      data-testid="input-address"
                                    />
                                    <Input
                                      defaultValue={selectedClient.phone || ''}
                                      className="bg-white"
                                      placeholder={t('common.phone') || 'Phone'}
                                      data-testid="input-phone"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                      defaultValue={selectedClient.email || ''}
                                      className="bg-white"
                                      placeholder={t('common.email') || 'Email'}
                                      data-testid="input-email"
                                    />
                                    <Select defaultValue={selectedClient.status || 'active'}>
                                      <SelectTrigger className="bg-white" data-testid="select-client-status">
                                        <SelectValue placeholder={t('common.status') || 'Status'} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">{t('common.active') || 'Active'}</SelectItem>
                                        <SelectItem value="inactive">{t('common.inactive') || 'Inactive'}</SelectItem>
                                        <SelectItem value="suspended">{t('common.suspended') || 'Suspended'}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.companyName}</h3>
                                  <p className="text-gray-600">CUI: {selectedClient.cui}</p>
                                  <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-600">
                                      <i className="fas fa-map-marker-alt mr-1"></i>
                                      {selectedClient.address || 'Address not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-phone mr-1"></i>
                                      {selectedClient.phone || 'Phone not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-envelope mr-1"></i>
                                      {selectedClient.email || 'Email not provided'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="bg-white rounded-lg px-3 py-2 text-center">
                              <p className="text-2xl font-bold text-primary">{selectedClient.activeWorkers || 0}</p>
                              <p className="text-xs text-gray-600">{t('common.activeWorkers') || 'Active Workers'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Workers Being Processed */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <i className="fas fa-users mr-2"></i>
                          {t('common.workersBeingProcessed') || 'Workers Being Processed'} ({selectedClient.activeWorkers || 0})
                        </h4>
                        
                        {assignments.filter((assignment: any) => assignment.clientId === selectedClient.id).length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                            <p className="text-gray-600">{t('common.noWorkersProcessing') || 'No workers currently being processed'}</p>
                            <Button className="mt-4" size="sm" data-testid="button-add-worker">
                              <i className="fas fa-plus mr-2"></i>
                              {t('actions.addWorker') || 'Add Worker'}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assignments
                              .filter((assignment: any) => assignment.clientId === selectedClient.id)
                              .map((assignment: any, index: number) => (
                              <div key={assignment.id || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                      <i className="fas fa-user text-green-600 text-lg"></i>
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-900">{assignment.worker?.fullName || 'Unknown Worker'}</h5>
                                      <p className="text-sm text-gray-600">{assignment.worker?.nationality || 'Nationality not specified'}</p>
                                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                        <span>
                                          <i className="fas fa-calendar mr-1"></i>
                                          Started: {new Date(assignment.createdAt || Date.now()).toLocaleDateString()}
                                        </span>
                                        <span>
                                          <i className="fas fa-briefcase mr-1"></i>
                                          {assignment.jobTitle || 'Job Title Not Specified'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      assignment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                      assignment.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {assignment.status?.replace('-', ' ')?.toUpperCase() || 'UNKNOWN'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Process Status Bar */}
                                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{t('common.processProgress') || 'Process Progress'}</span>
                                    <span className="text-xs text-gray-500">
                                      {assignment.currentStage || 'Stage not specified'}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    {[
                                      { stage: 'ajofm', label: 'AJOFM', status: assignment.ajofmStatus || 'pending' },
                                      { stage: 'work-permit', label: 'Work Permit', status: assignment.workPermitStatus || 'pending' },
                                      { stage: 'visa', label: 'Visa', status: assignment.visaStatus || 'pending' },
                                      { stage: 'residence', label: 'Residence', status: assignment.residenceStatus || 'pending' }
                                    ].map((step, stepIndex) => (
                                      <div key={step.stage} className="flex-1">
                                        <div className={`h-2 rounded-full ${
                                          step.status === 'completed' ? 'bg-green-500' :
                                          step.status === 'in-progress' ? 'bg-blue-500' :
                                          step.status === 'pending' ? 'bg-orange-500' :
                                          'bg-gray-300'
                                        }`}></div>
                                        <p className="text-xs mt-1 text-center text-gray-600">{step.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Pending Documents Summary */}
                                {assignment.pendingDocuments && assignment.pendingDocuments.length > 0 && (
                                  <div className="mt-3 flex items-center text-sm text-orange-600">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    {assignment.pendingDocuments.length} {t('common.pendingDocuments') || 'pending documents'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Collapsible Workflow Section */}
          <Collapsible open={workflowOpen} onOpenChange={setWorkflowOpen} className="mb-6">
            <Card data-testid="card-workflow-overview">
              <CardHeader className="border-b border-gray-200">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center">
                      <i className="fas fa-tasks mr-2"></i>
                      {t('common.workflowOverview') || 'Workflow Overview'}
                    </CardTitle>
                    {workflowOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('common.filters') || 'Filters'}:</span>
                    </div>
                    <Select value={workerFilter} onValueChange={setWorkerFilter}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-worker-filter">
                        <SelectValue placeholder={t('common.allWorkers') || 'All Workers'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allWorkers') || 'All Workers'}</SelectItem>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-stage-filter">
                        <SelectValue placeholder={t('common.allStages') || 'All Stages'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allStagesOption') || 'All Stages'}</SelectItem>
                        <SelectItem value="ajofm">{t('stages.ajofm') || 'AJOFM'}</SelectItem>
                        <SelectItem value="work-permit">{t('stages.workPermit') || 'Work Permit'}</SelectItem>
                        <SelectItem value="visa">{t('stages.visa') || 'Visa D/AM'}</SelectItem>
                        <SelectItem value="residence">{t('stages.residence') || 'Residence Permit'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <WorkflowKanban assignments={assignments} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Collapsible Recent Activity Section */}
          <Collapsible open={activityOpen} onOpenChange={setActivityOpen} className="mb-6">
            <Card data-testid="card-recent-activity">
              <CardHeader className="border-b border-gray-200">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center">
                      <i className="fas fa-history mr-2"></i>
                      {t('common.recentActivity') || 'Recent Activity'}
                    </CardTitle>
                    {activityOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('common.filters') || 'Filters'}:</span>
                    </div>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-activity-client-filter">
                        <SelectValue placeholder={t('common.allClients') || 'All Clients'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allClients') || 'All Clients'}</SelectItem>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-activity-type-filter">
                        <SelectValue placeholder={t('common.allActivities') || 'All Activities'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allActivities') || 'All Activities'}</SelectItem>
                        <SelectItem value="document">{t('common.documents') || 'Documents'}</SelectItem>
                        <SelectItem value="status">{t('common.statusChange') || 'Status Changes'}</SelectItem>
                        <SelectItem value="user">{t('common.userActions') || 'User Actions'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                        <p className="text-secondary">{t('common.noRecentActivity') || 'No recent activity'}</p>
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
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
