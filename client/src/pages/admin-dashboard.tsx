import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();
  
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
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  
  // Workers menu states
  const [selectedWorkflowClient, setSelectedWorkflowClient] = useState<any>(null);
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<any>(null);
  
  // Form state
  const [newClientForm, setNewClientForm] = useState({
    companyName: '',
    cui: '',
    address: '',
    caen: '',
    contactEmail: '',
    onrc: ''
  });

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

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setShowNewClientForm(false);
      setNewClientForm({
        companyName: '',
        cui: '',
        address: '',
        caen: '',
        contactEmail: '',
        onrc: ''
      });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate(newClientForm);
  };

  const handleFormChange = (field: string, value: string) => {
    setNewClientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          title={
            showNewClientForm 
              ? (t('actions.newClient') || "New Client")
              : selectedClient 
                ? selectedClient.companyName
                : selectedWorkflowClient 
                  ? selectedWorkflowClient.companyName + " - Workers"
                  : selectedWorkerDetail
                    ? selectedWorkerDetail.firstName + " " + selectedWorkerDetail.lastName + " - Workflow"
                    : (t('dashboard.admin.title') || "Admin Dashboard")
          }
          subtitle={
            showNewClientForm
              ? (t('common.fillClientDetails') || "Fill in the client information below")
              : selectedClient
                ? (t('dashboard.clientProfile') || "Client Profile & Management")
                : selectedWorkflowClient
                  ? (t('dashboard.workersManagement') || "Workers Management & Assignment")
                  : selectedWorkerDetail
                    ? (t('dashboard.workflowTracking') || "Immigration Workflow Tracking")
                    : (t('dashboard.admin.subtitle') || "Global workflow management and oversight")
          }
          actions={
            showNewClientForm ? null : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Input 
                  placeholder={t('common.searchPlaceholder') || 'Search clients, workers, CUI...'} 
                  className="w-full sm:w-80"
                  data-testid="input-global-search"
                />
                {!selectedClient && !selectedWorkflowClient && !selectedWorkerDetail && (
                  <Button 
                    data-testid="button-new-client" 
                    className="shrink-0"
                    onClick={() => setShowNewClientForm(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>{t('action.newClient') || 'New Client'}
                  </Button>
                )}
              </div>
            )
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
                  {!selectedClient && !showNewClientForm && (
                    <div className="space-y-4">
                      {/* New Client Button */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{t('common.clientList') || 'Client List'}</h4>
                        <Button
                          onClick={() => setShowNewClientForm(true)}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="button-new-client"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          {t('actions.newClient') || 'New Client'}
                        </Button>
                      </div>
                      
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

                  {/* New Client Form */}
                  {showNewClientForm && (
                    <div className="space-y-6">
                      {/* Form Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2 text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowNewClientForm(false)}
                            className="text-primary hover:text-primary/80"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            {t('common.clients') || 'Clients'}
                          </Button>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">{t('actions.newClient') || 'New Client'}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <i className="fas fa-building text-white"></i>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{t('actions.addNewClient') || 'Add New Client'}</h3>
                            <p className="text-gray-600">{t('common.fillClientDetails') || 'Fill in the client information below'}</p>
                          </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleCreateClient}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">{t('common.companyName') || 'Company Name'} *</label>
                              <Input
                                placeholder="e.g., Tech Solutions SRL"
                                className="bg-white"
                                data-testid="input-new-company-name"
                                value={newClientForm.companyName}
                                onChange={(e) => handleFormChange('companyName', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">{t('common.cui') || 'CUI'} *</label>
                              <Input
                                placeholder="e.g., RO12345678"
                                className="bg-white"
                                data-testid="input-new-cui"
                                value={newClientForm.cui}
                                onChange={(e) => handleFormChange('cui', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('common.address') || 'Address'} *</label>
                            <Input
                              placeholder="e.g., Strada Victoriei Nr. 10, Sector 1, București, România"
                              className="bg-white"
                              data-testid="input-new-address"
                              value={newClientForm.address}
                              onChange={(e) => handleFormChange('address', e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">{t('common.caen') || 'CAEN Code'} *</label>
                              <Input
                                placeholder="e.g., 6201"
                                className="bg-white"
                                data-testid="input-new-caen"
                                value={newClientForm.caen}
                                onChange={(e) => handleFormChange('caen', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">{t('common.onrc') || 'ONRC Number'}</label>
                              <Input
                                placeholder="e.g., J40/12345/2020"
                                className="bg-white"
                                data-testid="input-new-onrc"
                                value={newClientForm.onrc}
                                onChange={(e) => handleFormChange('onrc', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('common.contactEmail') || 'Contact Email'} *</label>
                            <Input
                              type="email"
                              placeholder="contact@company.com"
                              className="bg-white"
                              data-testid="input-new-contact-email"
                              value={newClientForm.contactEmail}
                              onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewClientForm(false)}
                              data-testid="button-cancel-new-client"
                            >
                              {t('actions.cancel') || 'Cancel'}
                            </Button>
                            <Button
                              type="submit"
                              className="bg-primary hover:bg-primary/90"
                              data-testid="button-save-new-client"
                              disabled={createClientMutation.isPending}
                            >
                              {createClientMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  {t('actions.saving') || 'Saving...'}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save mr-2"></i>
                                  {t('actions.saveClient') || 'Save Client'}
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
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
                  {/* Navigation Breadcrumb */}
                  {(selectedWorkflowClient || selectedWorkerDetail) && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedWorkflowClient(null);
                            setSelectedWorkerDetail(null);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <i className="fas fa-arrow-left mr-2"></i>
                          {t('common.workers') || 'Workers'}
                        </Button>
                        {selectedWorkflowClient && (
                          <>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedWorkerDetail(null)}
                              className={selectedWorkerDetail ? "text-primary hover:text-primary/80" : "text-gray-900"}
                            >
                              {selectedWorkflowClient.companyName}
                            </Button>
                          </>
                        )}
                        {selectedWorkerDetail && (
                          <>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{selectedWorkerDetail.worker?.fullName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client Selection Form */}
                  {!selectedWorkflowClient && (
                    <div className="space-y-6">
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <i className="fas fa-building text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.selectClient') || 'Select a Client'}</h3>
                        <p className="text-gray-600 mb-4">{t('common.selectClientDescription') || 'Choose a client to view their workers and application status'}</p>
                        
                        <Select onValueChange={(clientId) => {
                          const client = clients.find((c: any) => c.id === clientId);
                          setSelectedWorkflowClient(client);
                        }}>
                          <SelectTrigger className="w-full max-w-md mx-auto" data-testid="select-workflow-client">
                            <SelectValue placeholder={t('common.chooseClient') || 'Choose Client'} />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center space-x-2">
                                  <i className="fas fa-building text-primary"></i>
                                  <span>{client.companyName} - CUI: {client.cui}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Workers List */}
                  {selectedWorkflowClient && !selectedWorkerDetail && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <i className="fas fa-building text-white"></i>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedWorkflowClient.companyName}</h3>
                            <p className="text-sm text-gray-600">CUI: {selectedWorkflowClient.cui}</p>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <i className="fas fa-users mr-2"></i>
                        {t('common.workerApplications') || 'Worker Applications'}
                      </h4>

                      {assignments.filter((assignment: any) => assignment.clientId === selectedWorkflowClient.id).length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <i className="fas fa-user-plus text-gray-400 text-3xl mb-4"></i>
                          <p className="text-gray-600">{t('common.noWorkersForClient') || 'No workers found for this client'}</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {assignments
                            .filter((assignment: any) => assignment.clientId === selectedWorkflowClient.id)
                            .map((assignment: any, index: number) => (
                            <div 
                              key={assignment.id || index} 
                              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedWorkerDetail(assignment)}
                              data-testid={`worker-application-${index}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user text-green-600"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{assignment.worker?.fullName || 'Unknown Worker'}</h5>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span><i className="fas fa-flag mr-1"></i>{assignment.worker?.nationality || 'Unknown'}</span>
                                      <span><i className="fas fa-briefcase mr-1"></i>{assignment.jobTitle || 'Job not specified'}</span>
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
                                  <div className="mt-1 text-xs text-gray-500">
                                    {assignment.currentStage || 'Stage not specified'}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Status Overview */}
                              <div className="mt-3 flex space-x-1">
                                {[
                                  { stage: 'ajofm', status: assignment.ajofmStatus || 'pending' },
                                  { stage: 'work-permit', status: assignment.workPermitStatus || 'pending' },
                                  { stage: 'visa', status: assignment.visaStatus || 'pending' },
                                  { stage: 'residence', status: assignment.residenceStatus || 'pending' }
                                ].map((step, stepIndex) => (
                                  <div key={step.stage} className="flex-1">
                                    <div className={`h-1.5 rounded-full ${
                                      step.status === 'completed' ? 'bg-green-500' :
                                      step.status === 'in-progress' ? 'bg-blue-500' :
                                      step.status === 'pending' ? 'bg-orange-500' :
                                      'bg-gray-300'
                                    }`}></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Worker Detail Flowchart */}
                  {selectedWorkerDetail && (
                    <div className="space-y-6">
                      {/* Worker Header */}
                      <div className="bg-green-50 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                              <i className="fas fa-user text-white text-xl"></i>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{selectedWorkerDetail.worker?.fullName}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span><i className="fas fa-flag mr-1"></i>{selectedWorkerDetail.worker?.nationality}</span>
                                <span><i className="fas fa-briefcase mr-1"></i>{selectedWorkerDetail.jobTitle}</span>
                                <span><i className="fas fa-building mr-1"></i>{selectedWorkflowClient.companyName}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                              selectedWorkerDetail.status === 'completed' ? 'bg-green-100 text-green-800' :
                              selectedWorkerDetail.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              selectedWorkerDetail.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedWorkerDetail.status?.replace('-', ' ')?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Document Status Flowchart */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <i className="fas fa-file-alt mr-2"></i>
                          {t('common.documentFlow') || 'Document Flow & Status'}
                        </h4>
                        
                        <div className="space-y-6">
                          {[
                            {
                              stage: 'ajofm',
                              title: t('stages.ajofm') || 'AJOFM Labor Market Test',
                              status: selectedWorkerDetail.ajofmStatus || 'pending',
                              documents: [
                                { name: 'Employment Contract', status: selectedWorkerDetail.ajofmDocuments?.employmentContract || 'pending' },
                                { name: 'Job Description', status: selectedWorkerDetail.ajofmDocuments?.jobDescription || 'pending' },
                                { name: 'Company Registration', status: selectedWorkerDetail.ajofmDocuments?.companyRegistration || 'received' }
                              ],
                              authorityResponse: selectedWorkerDetail.ajofmResponse || 'pending'
                            },
                            {
                              stage: 'work-permit',
                              title: t('stages.workPermit') || 'IGI Work Permit',
                              status: selectedWorkerDetail.workPermitStatus || 'pending',
                              documents: [
                                { name: 'Passport Copy', status: selectedWorkerDetail.workPermitDocuments?.passport || 'pending' },
                                { name: 'Diploma Translation', status: selectedWorkerDetail.workPermitDocuments?.diploma || 'pending' },
                                { name: 'Criminal Background Check', status: selectedWorkerDetail.workPermitDocuments?.background || 'pending' },
                                { name: 'AJOFM Approval', status: selectedWorkerDetail.ajofmStatus === 'completed' ? 'received' : 'pending' }
                              ],
                              authorityResponse: selectedWorkerDetail.workPermitResponse || 'pending'
                            },
                            {
                              stage: 'visa',
                              title: t('stages.visa') || 'Consulate Visa D/AM',
                              status: selectedWorkerDetail.visaStatus || 'pending',
                              documents: [
                                { name: 'Visa Application Form', status: selectedWorkerDetail.visaDocuments?.application || 'pending' },
                                { name: 'Work Permit Copy', status: selectedWorkerDetail.workPermitStatus === 'completed' ? 'received' : 'pending' },
                                { name: 'Medical Certificate', status: selectedWorkerDetail.visaDocuments?.medical || 'pending' },
                                { name: 'Proof of Accommodation', status: selectedWorkerDetail.visaDocuments?.accommodation || 'pending' }
                              ],
                              authorityResponse: selectedWorkerDetail.visaResponse || 'pending'
                            },
                            {
                              stage: 'residence',
                              title: t('stages.residence') || 'Residence Permit',
                              status: selectedWorkerDetail.residenceStatus || 'pending',
                              documents: [
                                { name: 'Residence Application', status: selectedWorkerDetail.residenceDocuments?.application || 'pending' },
                                { name: 'Entry Stamp/Visa', status: selectedWorkerDetail.visaStatus === 'completed' ? 'received' : 'pending' },
                                { name: 'Employment Proof', status: selectedWorkerDetail.residenceDocuments?.employment || 'pending' },
                                { name: 'Health Insurance', status: selectedWorkerDetail.residenceDocuments?.insurance || 'pending' }
                              ],
                              authorityResponse: selectedWorkerDetail.residenceResponse || 'pending'
                            }
                          ].map((stage, stageIndex) => (
                            <div key={stage.stage} className="border rounded-lg p-6 bg-white">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                    stage.status === 'completed' ? 'bg-green-500' :
                                    stage.status === 'in-progress' ? 'bg-blue-500' :
                                    stage.status === 'pending' ? 'bg-orange-500' :
                                    'bg-gray-400'
                                  }`}>
                                    {stageIndex + 1}
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{stage.title}</h5>
                                    <p className="text-sm text-gray-600 capitalize">{stage.status.replace('-', ' ')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <i className={`fas text-lg ${
                                    stage.status === 'completed' ? 'fa-check-circle text-green-500' :
                                    stage.status === 'in-progress' ? 'fa-clock text-blue-500' :
                                    stage.status === 'pending' ? 'fa-hourglass-half text-orange-500' :
                                    'fa-circle text-gray-400'
                                  }`}></i>
                                </div>
                              </div>

                              {/* Document Status Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <i className="fas fa-file-import mr-2"></i>
                                    {t('common.documentsRequired') || 'Documents Required'}
                                  </h6>
                                  <div className="space-y-2">
                                    {stage.documents.map((doc, docIndex) => (
                                      <div key={docIndex} className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">{doc.name}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          doc.status === 'received' ? 'bg-green-100 text-green-800' :
                                          doc.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {doc.status === 'received' ? 'Received' : 'Pending'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h6 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <i className="fas fa-university mr-2"></i>
                                    {t('common.authorityResponse') || 'Authority Response'}
                                  </h6>
                                  <div className={`p-4 rounded-lg border-2 ${
                                    stage.authorityResponse === 'approved' ? 'border-green-200 bg-green-50' :
                                    stage.authorityResponse === 'rejected' ? 'border-red-200 bg-red-50' :
                                    stage.authorityResponse === 'in-review' ? 'border-blue-200 bg-blue-50' :
                                    'border-gray-200 bg-gray-50'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <i className={`fas ${
                                        stage.authorityResponse === 'approved' ? 'fa-check-circle text-green-600' :
                                        stage.authorityResponse === 'rejected' ? 'fa-times-circle text-red-600' :
                                        stage.authorityResponse === 'in-review' ? 'fa-clock text-blue-600' :
                                        'fa-hourglass-half text-gray-600'
                                      }`}></i>
                                      <span className={`font-medium ${
                                        stage.authorityResponse === 'approved' ? 'text-green-800' :
                                        stage.authorityResponse === 'rejected' ? 'text-red-800' :
                                        stage.authorityResponse === 'in-review' ? 'text-blue-800' :
                                        'text-gray-800'
                                      }`}>
                                        {stage.authorityResponse === 'approved' ? 'Approved' :
                                         stage.authorityResponse === 'rejected' ? 'Rejected' :
                                         stage.authorityResponse === 'in-review' ? 'In Review' :
                                         'Pending Submission'}
                                      </span>
                                    </div>
                                    {stage.authorityResponse !== 'pending' && (
                                      <p className="text-xs mt-1 text-gray-600">
                                        Response received on {new Date().toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Flow Arrow */}
                              {stageIndex < 3 && (
                                <div className="flex justify-center mt-4">
                                  <i className="fas fa-arrow-down text-gray-400 text-xl"></i>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
