import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import WorkflowKanban from "@/components/kanban/workflow-kanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Collapsible states
  const [clientsOpen, setClientsOpen] = useState(true);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  
  // Filter states
  const [clientFilter, setClientFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  
  // Navigation states
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [editingWorker, setEditingWorker] = useState(false);
  
  
  // Form state
  const [newClientForm, setNewClientForm] = useState({
    legalName: '',
    registrationNumber: '',
    cui: '',
    legalAddress: '',
    adminName: '',
    contactEmail: '',
    phoneNumber: '',
    bankIban: '',
    caen: ''
  });

  const [editWorkerForm, setEditWorkerForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    email: '',
    phone: '',
    passportNumber: '',
    dob: '',
    passportExpiry: ''
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
    enabled: isAuthenticated && !isLoading,
  });

  const { data: recentActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard/activities"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);



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
        legalName: '',
        registrationNumber: '',
        cui: '',
        legalAddress: '',
        adminName: '',
        contactEmail: '',
        phoneNumber: '',
        bankIban: '',
        caen: ''
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
      <Sidebar userRole="ADMIN" onSectionChange={setActiveSection} currentSection={activeSection} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={
            showNewClientForm 
              ? "New Client"
              : selectedClient 
                ? "Admin Dashboard"
                : activeSection === "clients"
                  ? "Clients"
                  : activeSection === "workers" 
                    ? "Workers & Workflow"
                    : activeSection === "documents"
                      ? "Documents" 
                      : activeSection === "reports"
                        ? "Reports"
                        : activeSection === "requirements"
                          ? "Requirements"
                          : activeSection === "reminders"
                            ? "Reminders"
                            : activeSection === "audit"
                              ? "Audit Logs"
                              : "Admin Dashboard"
          }
          subtitle={
            showNewClientForm
              ? (t('common.fillClientDetails') || "Fill in the client information below")
              : selectedClient
                ? selectedClient.legalName + " - " + (t('dashboard.clientProfile') || "Client Profile & Management")
                : (t('dashboard.admin.subtitle') || "Global workflow management and oversight")
          }
          actions={
            showNewClientForm ? null : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Input 
                  placeholder={t('common.searchPlaceholder') || 'Search clients, workers, CUI...'} 
                  className="w-full sm:w-80"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  data-testid="input-global-search"
                />
                {!selectedClient && (
                  <Button 
                    data-testid="button-new-client" 
                    className="shrink-0"
                    onClick={() => setShowNewClientForm(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>{t('actions.newClient') || 'New Client'}
                  </Button>
                )}
              </div>
            )
          }
        />

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 max-w-full overflow-x-hidden" style={{ paddingTop: 'calc(1rem + var(--header-offset, 0px))' }}>
            {activeSection === "overview" && (
              <>
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
                      
                      {(() => {
                        const filteredClients = clients.filter((client: any) => {
                          const matchesSearch = !clientSearchTerm || 
                            client.legalName?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.cui?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.contactEmail?.toLowerCase().includes(clientSearchTerm.toLowerCase());
                          
                          const matchesStatus = statusFilter === "all" || 
                            (client.status || "active").toLowerCase() === statusFilter.toLowerCase();
                          
                          const matchesClientFilter = clientFilter === "all" || 
                            (clientFilter === "active" && (client.status || "active") === "active") ||
                            (clientFilter === "inactive" && client.status === "inactive");
                          
                          return matchesSearch && matchesStatus && matchesClientFilter;
                        });

                        if (filteredClients.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <i className="fas fa-building text-gray-400 text-3xl mb-4"></i>
                              <p className="text-secondary">
                                {clientSearchTerm || clientFilter !== "all" || statusFilter !== "all" 
                                  ? "No clients match your filters"
                                  : "No clients found"
                                }
                              </p>
                            </div>
                          );
                        }

                        return filteredClients.map((client: any, index: number) => (
                          <div 
                            key={client.id || index} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedWorker(null); // Reset worker selection when selecting new client
                            }}
                            data-testid={`client-${index}`}
                          >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-building text-primary"></i>
                            </div>
                            <div>
                              <p className="font-medium">{client.legalName}</p>
                              <p className="text-sm text-secondary">CUI: {client.cui}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{client.activeWorkers || 0} workers</p>
                            <p className="text-xs text-secondary">{client.status}</p>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                          </div>
                        </div>
                        ));
                      })()}
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
                              <label className="text-sm font-medium text-gray-700">Legal Name *</label>
                              <Input
                                placeholder="e.g., Tech Solutions SRL"
                                className="bg-white"
                                data-testid="input-new-legal-name"
                                value={newClientForm.legalName}
                                onChange={(e) => handleFormChange('legalName', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Registration Number (ONRC) *</label>
                              <Input
                                placeholder="e.g., J40/12345/2020"
                                className="bg-white"
                                data-testid="input-new-registration-number"
                                value={newClientForm.registrationNumber}
                                onChange={(e) => handleFormChange('registrationNumber', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">CUI (Fiscal Code) *</label>
                              <Input
                                placeholder="e.g., RO12345678"
                                className="bg-white"
                                data-testid="input-new-cui"
                                value={newClientForm.cui}
                                onChange={(e) => handleFormChange('cui', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">CAEN Code *</label>
                              <Input
                                placeholder="e.g., 6201"
                                className="bg-white"
                                data-testid="input-new-caen"
                                value={newClientForm.caen}
                                onChange={(e) => handleFormChange('caen', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Legal Address (Sediu Legal) *</label>
                            <Input
                              placeholder="e.g., Strada Victoriei Nr. 10, Sector 1, București, România"
                              className="bg-white"
                              data-testid="input-new-legal-address"
                              value={newClientForm.legalAddress}
                              onChange={(e) => handleFormChange('legalAddress', e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Administrator Name *</label>
                            <Input
                              placeholder="e.g., Ion Popescu"
                              className="bg-white"
                              data-testid="input-new-admin-name"
                              value={newClientForm.adminName}
                              onChange={(e) => handleFormChange('adminName', e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Contact Email *</label>
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
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                              <Input
                                placeholder="e.g., +40 21 123 4567"
                                className="bg-white"
                                data-testid="input-new-phone-number"
                                value={newClientForm.phoneNumber}
                                onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bank IBAN Account *</label>
                            <Input
                              placeholder="e.g., RO49AAAA1B31007593840000"
                              className="bg-white"
                              data-testid="input-new-bank-iban"
                              value={newClientForm.bankIban}
                              onChange={(e) => handleFormChange('bankIban', e.target.value)}
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
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Legal Name *</label>
                                      <Input
                                        defaultValue={selectedClient.legalName}
                                        className="bg-white"
                                        placeholder="e.g., Tech Solutions SRL"
                                        data-testid="input-edit-legal-name"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Registration Number *</label>
                                      <Input
                                        defaultValue={selectedClient.registrationNumber}
                                        className="bg-white"
                                        placeholder="e.g., J40/12345/2020"
                                        data-testid="input-edit-registration-number"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">CUI *</label>
                                      <Input
                                        defaultValue={selectedClient.cui}
                                        className="bg-white"
                                        placeholder="e.g., RO12345678"
                                        data-testid="input-edit-cui"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">CAEN Code *</label>
                                      <Input
                                        defaultValue={selectedClient.caen}
                                        className="bg-white"
                                        placeholder="e.g., 6201"
                                        data-testid="input-edit-caen"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Legal Address *</label>
                                    <Input
                                      defaultValue={selectedClient.legalAddress}
                                      className="bg-white"
                                      placeholder="e.g., Strada Victoriei Nr. 10, Sector 1, București"
                                      data-testid="input-edit-legal-address"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Administrator Name *</label>
                                    <Input
                                      defaultValue={selectedClient.adminName}
                                      className="bg-white"
                                      placeholder="e.g., Ion Popescu"
                                      data-testid="input-edit-admin-name"
                                      required
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Contact Email *</label>
                                      <Input
                                        type="email"
                                        defaultValue={selectedClient.contactEmail}
                                        className="bg-white"
                                        placeholder="contact@company.com"
                                        data-testid="input-edit-contact-email"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                                      <Input
                                        defaultValue={selectedClient.phoneNumber}
                                        className="bg-white"
                                        placeholder="e.g., +40 21 123 4567"
                                        data-testid="input-edit-phone-number"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Bank IBAN *</label>
                                    <Input
                                      defaultValue={selectedClient.bankIban}
                                      className="bg-white"
                                      placeholder="e.g., RO49AAAA1B31007593840000"
                                      data-testid="input-edit-bank-iban"
                                      required
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.legalName}</h3>
                                  <p className="text-gray-600">CUI: {selectedClient.cui}</p>
                                  <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-600">
                                      <i className="fas fa-map-marker-alt mr-1"></i>
                                      {selectedClient.legalAddress || 'Address not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-phone mr-1"></i>
                                      {selectedClient.phoneNumber || 'Phone not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-envelope mr-1"></i>
                                      {selectedClient.contactEmail || 'Email not provided'}
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

                      {/* Quick Actions for Workers */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold flex items-center mb-3">
                          <i className="fas fa-users mr-2"></i>
                          Workers Management
                        </h4>
                        <p className="text-gray-600 text-sm mb-4">
                          Manage workers for {selectedClient.legalName}. Use the Workers & Workflow section for detailed worker management.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            onClick={() => setActiveSection("workers")}
                            className="flex-1 min-w-0"
                            data-testid="button-view-workers"
                          >
                            <i className="fas fa-users mr-2"></i>
                            View Workers ({selectedClient.activeWorkers || 0})
                          </Button>
                          <Button 
                            variant="outline"
                            data-testid="button-add-worker"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Add Worker
                          </Button>
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
                        <SelectItem value="document">Document Uploads</SelectItem>
                        <SelectItem value="status">Status Changes</SelectItem>
                        <SelectItem value="assignment">Worker Assignments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-4">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-clock text-gray-400 text-3xl mb-4"></i>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{t('common.noRecentActivity') || 'No Recent Activity'}</h4>
                        <p className="text-gray-600">{t('common.noRecentActivityDescription') || 'Activity from clients and workers will appear here.'}</p>
                      </div>
                    ) : (
                      recentActivities.slice(0, 10).map((activity: any, index: number) => (
                        <div key={activity.id || index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className={`fas ${
                              activity.type === 'document' ? 'fa-file-alt' :
                              activity.type === 'status' ? 'fa-exchange-alt' :
                              activity.type === 'assignment' ? 'fa-user-plus' :
                              'fa-info'
                            } text-primary`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{activity.clientName || 'Unknown Client'}</span> - {activity.description}
                            </p>
                            <p className="text-xs text-secondary mt-1">
                              {new Date(activity.timestamp || Date.now()).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.type === 'document' ? 'bg-green-100 text-green-800' :
                            activity.type === 'status' ? 'bg-blue-100 text-blue-800' :
                            activity.type === 'assignment' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.type === 'document' ? 'Document' :
                             activity.type === 'status' ? 'Status' :
                             activity.type === 'assignment' ? 'Assignment' :
                             'Other'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
              </>
            )}

          {/* Workers Section - Available for both mobile and desktop */}
          {activeSection === "workers" && (
            <div className="space-y-6">
              {!selectedClient ? (
                // Step 1: Show message to select a client first
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Workers & Workflow Management</h3>
                      <p className="text-gray-600 mb-4">Select a client from the Clients section to view their workers and workflow</p>
                      <Button 
                        onClick={() => setActiveSection("clients")}
                        className="mt-2"
                        data-testid="button-go-to-clients"
                      >
                        <i className="fas fa-building mr-2"></i>
                        Go to Clients
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !selectedWorker ? (
                // Step 2: Show workers list for selected client
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <i className="fas fa-users mr-2"></i>
                          Workers for {selectedClient.legalName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Click on a worker to view their immigration workflow
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedClient(null)}
                        data-testid="button-back-to-client-selection"
                      >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Client Selection
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Filter assignments by matching clientProfileId to selectedClient.id
                      const clientAssignments = assignments.filter((assignment: any) => 
                        assignment.clientProfileId === selectedClient.id
                      );
                      
                      // Group assignments by workerId to create worker entries with actual worker data
                      const workersMap = new Map();
                      clientAssignments.forEach((assignment: any) => {
                        const workerId = assignment.workerId;
                        const workerData = assignment.worker; // This contains the actual worker info!
                        
                        if (!workersMap.has(workerId)) {
                          workersMap.set(workerId, {
                            id: workerId,
                            assignments: [],
                            status: assignment.status,
                            createdAt: assignment.createdAt,
                            // Use actual worker data if available
                            firstName: workerData?.firstName,
                            lastName: workerData?.lastName,
                            nationality: workerData?.nationality,
                            email: workerData?.email,
                            worker: workerData // Keep full worker object for reference
                          });
                        }
                        workersMap.get(workerId).assignments.push(assignment);
                      });
                      
                      const clientWorkers = Array.from(workersMap.values());

                      if (clientWorkers.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <i className="fas fa-user-plus text-gray-400 text-3xl mb-4"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers Found</h3>
                            <p className="text-gray-600 mb-4">This client doesn't have any workers assigned yet.</p>
                            <Button data-testid="button-add-first-worker">
                              <i className="fas fa-plus mr-2"></i>
                              Add First Worker
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {clientWorkers.map((worker: any, index: number) => (
                            <div 
                              key={worker.id || index}
                              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedWorker(worker)}
                              data-testid={`worker-${index}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user text-blue-600 text-lg"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">
                                      {worker.firstName && worker.lastName 
                                        ? `${worker.firstName} ${worker.lastName}`
                                        : `Worker #${index + 1}`}
                                    </h5>
                                    <p className="text-sm text-gray-600">
                                      {worker.nationality || 'Nationality pending'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Started: {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'Date pending'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    worker.status === 'ACCEPTED' || worker.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    worker.status === 'SUBMITTED_BY_USER' || worker.status === 'RECEIVED_BY_ADMIN' || worker.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                    worker.status === 'AWAITING_UPLOAD' ? 'bg-yellow-100 text-yellow-800' :
                                    worker.status === 'REJECTED' || worker.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {worker.status === 'NOT_STARTED' ? 'Not Started' :
                                     worker.status === 'AWAITING_UPLOAD' ? 'Awaiting Upload' :
                                     worker.status === 'SUBMITTED_BY_USER' ? 'Submitted' :
                                     worker.status === 'RECEIVED_BY_ADMIN' ? 'Under Review' :
                                     worker.status === 'ACCEPTED' ? 'Accepted' :
                                     worker.status === 'REJECTED' ? 'Rejected' :
                                     worker.status || 'Pending'}
                                  </span>
                                  <div className="mt-1">
                                    <i className="fas fa-chevron-right text-gray-400"></i>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                // Step 3: Show detailed workflow for selected worker
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <i className="fas fa-clipboard-list mr-2"></i>
                          Immigration Workflow: {selectedWorker.worker?.firstName && selectedWorker.worker?.lastName 
                            ? `${selectedWorker.worker.firstName} ${selectedWorker.worker.lastName}`
                            : selectedWorker.firstName && selectedWorker.lastName 
                            ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                            : 'Worker'}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Client: {selectedClient.legalName}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedWorker(null)}
                        data-testid="button-back-to-workers-list"
                      >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Workers List
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Worker Information */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Worker Information</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Initialize form with current worker data
                              setEditWorkerForm({
                                firstName: selectedWorker.worker?.firstName || '',
                                lastName: selectedWorker.worker?.lastName || '',
                                nationality: selectedWorker.worker?.nationality || '',
                                email: selectedWorker.worker?.email || '',
                                phone: selectedWorker.worker?.phone || '',
                                passportNumber: selectedWorker.worker?.passportNumber || '',
                                dob: selectedWorker.worker?.dob ? new Date(selectedWorker.worker.dob).toISOString().split('T')[0] : '',
                                passportExpiry: selectedWorker.worker?.passportExpiry ? new Date(selectedWorker.worker.passportExpiry).toISOString().split('T')[0] : ''
                              });
                              setEditingWorker(true);
                            }}
                            data-testid="button-edit-worker-profile"
                          >
                            <i className="fas fa-edit mr-2"></i>
                            Edit Profile
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">
                              {selectedWorker.firstName && selectedWorker.lastName 
                                ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                                : 'Name pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Nationality:</span>
                            <span className="ml-2 font-medium">{selectedWorker.nationality || 'Pending'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-medium">{selectedWorker.email || 'Pending'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Started:</span>
                            <span className="ml-2 font-medium">
                              {selectedWorker.createdAt 
                                ? new Date(selectedWorker.createdAt).toLocaleDateString()
                                : 'Date pending'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Workflow Status */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Immigration Process Status</h4>
                        <div className="space-y-4">
                          {/* AJOFM (Labor Market Test) */}
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <i className="fas fa-briefcase text-sm"></i>
                              </div>
                              <div>
                                <h5 className="font-medium">AJOFM Labor Market Test</h5>
                                <p className="text-sm text-gray-600">Romanian Employment Agency approval</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          {/* IGI Work Permit */}
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <i className="fas fa-id-card text-sm"></i>
                              </div>
                              <div>
                                <h5 className="font-medium">IGI Work Permit</h5>
                                <p className="text-sm text-gray-600">Romanian Immigration Office work authorization</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          {/* Consulate Visa */}
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <i className="fas fa-passport text-sm"></i>
                              </div>
                              <div>
                                <h5 className="font-medium">Consulate Visa Application</h5>
                                <p className="text-sm text-gray-600">Romanian consulate visa processing</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          {/* Residence Permit */}
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <i className="fas fa-home text-sm"></i>
                              </div>
                              <div>
                                <h5 className="font-medium">Residence Permit</h5>
                                <p className="text-sm text-gray-600">Final residence permit in Romania</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Mobile Navigation & Quick Action Sections */}
          {isMobile && (
            <>
              <div className="space-y-6">
              {/* Documents Section */}
              {activeSection === "documents" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-file-alt text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
                        <p className="text-secondary">Generate, track, and manage Romanian immigration documents</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Workers Section */}
              {activeSection === "workers" && (
                <div className="space-y-6">
                  {!selectedClient ? (
                    // Step 1: Show message to select a client first
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center py-8">
                          <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Workers & Workflow Management</h3>
                          <p className="text-gray-600 mb-4">Select a client from the Clients section to view their workers and workflow</p>
                          <Button 
                            onClick={() => setActiveSection("clients")}
                            className="mt-2"
                            data-testid="button-go-to-clients"
                          >
                            <i className="fas fa-building mr-2"></i>
                            Go to Clients
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : !selectedWorker ? (
                    // Step 2: Show workers list for selected client
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center">
                              <i className="fas fa-users mr-2"></i>
                              Workers for {selectedClient.legalName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Click on a worker to view their immigration workflow
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedClient(null)}
                            data-testid="button-back-to-client-selection"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Client Selection
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Filter assignments by matching clientProfileId to selectedClient.id
                          const clientAssignments = assignments.filter((assignment: any) => 
                            assignment.clientProfileId === selectedClient.id
                          );
                          
                          // Group assignments by workerId to create worker entries with actual worker data
                          const workersMap = new Map();
                          clientAssignments.forEach((assignment: any) => {
                            const workerId = assignment.workerId;
                            const workerData = assignment.worker; // This contains the actual worker info!
                            
                            if (!workersMap.has(workerId)) {
                              workersMap.set(workerId, {
                                id: workerId,
                                assignments: [],
                                status: assignment.status,
                                createdAt: assignment.createdAt,
                                // Use actual worker data if available
                                firstName: workerData?.firstName,
                                lastName: workerData?.lastName,
                                nationality: workerData?.nationality,
                                email: workerData?.email,
                                worker: workerData // Keep full worker object for reference
                              });
                            }
                            workersMap.get(workerId).assignments.push(assignment);
                          });
                          
                          const clientWorkers = Array.from(workersMap.values());
                          
                          if (clientWorkers.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <i className="fas fa-user-plus text-gray-400 text-3xl mb-4"></i>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers Found</h3>
                                <p className="text-gray-600 mb-4">This client doesn't have any workers assigned yet.</p>
                                <Button data-testid="button-add-first-worker">
                                  <i className="fas fa-plus mr-2"></i>
                                  Add First Worker
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {clientWorkers.map((worker: any, index: number) => (
                                <div 
                                  key={worker.id || index}
                                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedWorker(worker)}
                                  data-testid={`worker-${index}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-user text-blue-600 text-lg"></i>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">
                                          {worker.firstName && worker.lastName 
                                            ? `${worker.firstName} ${worker.lastName}`
                                            : `Worker #${index + 1}`}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {worker.nationality || 'Nationality pending'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Started: {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'Date pending'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        worker.status === 'ACCEPTED' || worker.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        worker.status === 'SUBMITTED_BY_USER' || worker.status === 'RECEIVED_BY_ADMIN' || worker.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                        worker.status === 'AWAITING_UPLOAD' ? 'bg-yellow-100 text-yellow-800' :
                                        worker.status === 'REJECTED' || worker.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {worker.status === 'NOT_STARTED' ? 'Not Started' :
                                         worker.status === 'AWAITING_UPLOAD' ? 'Awaiting Upload' :
                                         worker.status === 'SUBMITTED_BY_USER' ? 'Submitted' :
                                         worker.status === 'RECEIVED_BY_ADMIN' ? 'Under Review' :
                                         worker.status === 'ACCEPTED' ? 'Accepted' :
                                         worker.status === 'REJECTED' ? 'Rejected' :
                                         worker.status || 'Pending'}
                                      </span>
                                      <div className="mt-1">
                                        <i className="fas fa-chevron-right text-gray-400"></i>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ) : (
                    // Step 3: Show detailed workflow for selected worker
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center">
                              <i className="fas fa-clipboard-list mr-2"></i>
                              Immigration Workflow: {selectedWorker.firstName && selectedWorker.lastName 
                                ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                                : selectedWorker.workerName || 'Worker'
                              }
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Client: {selectedClient.legalName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedWorker(null)}
                            data-testid="button-back-to-workers-list"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Workers List
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Worker Information */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Worker Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Name:</span>
                                <span className="ml-2 font-medium">
                                  {selectedWorker.firstName && selectedWorker.lastName 
                                    ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                                    : selectedWorker.workerName || 'Name pending'
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Nationality:</span>
                                <span className="ml-2 font-medium">{selectedWorker.nationality || 'Pending'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 font-medium">{selectedWorker.email || selectedWorker.workerEmail || 'Pending'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Started:</span>
                                <span className="ml-2 font-medium">
                                  {selectedWorker.startDate || selectedWorker.createdAt 
                                    ? new Date(selectedWorker.startDate || selectedWorker.createdAt).toLocaleDateString()
                                    : 'Date pending'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Workflow Status */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Immigration Process Status</h4>
                            <div className="space-y-4">
                              {/* AJOFM (Labor Market Test) */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-briefcase text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">AJOFM Labor Market Test</h5>
                                    <p className="text-sm text-gray-600">Romanian Employment Agency approval</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* IGI Work Permit */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-id-card text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">IGI Work Permit</h5>
                                    <p className="text-sm text-gray-600">Romanian Immigration Office work authorization</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* Consulate Visa */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-passport text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">Consulate Visa Application</h5>
                                    <p className="text-sm text-gray-600">Romanian consulate visa processing</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* Residence Permit */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-home text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">Residence Permit</h5>
                                    <p className="text-sm text-gray-600">Final residence permit in Romania</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Reports Section */}
              {activeSection === "reports" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-chart-bar text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                        <p className="text-secondary">Detailed insights and analytics for immigration workflows</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Requirements Section */}
              {activeSection === "requirements" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-list-check text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Requirements Management</h3>
                        <p className="text-secondary">Configure workflow requirements and validation rules</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Reminders Section */}
              {activeSection === "reminders" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-bell text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Reminders & Notifications</h3>
                        <p className="text-secondary">Set up automated reminders for deadlines and important dates</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Audit Section */}
              {activeSection === "audit" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
                        <p className="text-secondary">Track all system activities and user actions for compliance</p>
                      </div>
                      {auditLogs.length > 0 && (
                        <div className="mt-6 space-y-4">
                          {auditLogs.slice(0, 10).map((log: any, index: number) => (
                            <div key={log.id || index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
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
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            </>
          )}
        </div>

        {/* Edit Worker Dialog */}
        <Dialog open={editingWorker} onOpenChange={setEditingWorker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                <i className="fas fa-user-edit mr-2"></i>
                Edit Worker Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editWorkerForm.firstName}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editWorkerForm.lastName}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={editWorkerForm.nationality}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, nationality: e.target.value})}
                    placeholder="Enter nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editWorkerForm.email}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editWorkerForm.phone}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={editWorkerForm.passportNumber}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, passportNumber: e.target.value})}
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editWorkerForm.dob}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, dob: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="passportExpiry">Passport Expiry Date</Label>
                  <Input
                    id="passportExpiry"
                    type="date"
                    value={editWorkerForm.passportExpiry}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, passportExpiry: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingWorker(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const workerId = selectedWorker.worker?.id;
                      if (!workerId) {
                        toast({
                          title: "Error",
                          description: "Worker ID not found. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      }

                      const response = await apiRequest("PUT", `/api/workers/${workerId}`, editWorkerForm);
                      
                      if (response.ok) {
                        // Update the selected worker data locally
                        const updatedWorker = await response.json();
                        setSelectedWorker((prev: any) => ({
                          ...prev,
                          worker: updatedWorker,
                          // Also update the top-level fields for immediate UI refresh
                          firstName: updatedWorker.firstName,
                          lastName: updatedWorker.lastName,
                          nationality: updatedWorker.nationality,
                          email: updatedWorker.email,
                          phone: updatedWorker.phone,
                          passportNumber: updatedWorker.passportNumber,
                          dob: updatedWorker.dob,
                          passportExpiry: updatedWorker.passportExpiry
                        }));
                        
                        // Invalidate and refetch assignments to update all worker data throughout the app
                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients", selectedClient?.id, "assignments"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/dashboard/assignments"]
                        });
                        
                        toast({
                          title: "Profile Updated",
                          description: "Worker profile has been updated successfully.",
                        });
                        setEditingWorker(false);
                      } else {
                        throw new Error("Failed to update profile");
                      }
                    } catch (error) {
                      console.error("Error updating worker profile:", error);
                      toast({
                        title: "Error",
                        description: "Failed to update worker profile. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-save-worker-profile"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
  );
}
