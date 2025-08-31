import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Plus, Search, Filter, Edit2, Eye, MapPin, Calendar, Users, Phone, Mail, ChevronDown, ChevronRight, FileText, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

interface Client {
  id: string;
  legalName: string;
  adminName: string;
  contactEmail: string;
  phoneNumber?: string;
  legalAddress?: string;
  cui?: string;
  registrationNumber?: string;
  bankIban?: string;
  caen?: string;
  ownerUserId: string;
  createdAt: string;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  currentWorkPermitExpiry?: string;
  status: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowProgressData {
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  progress: {
    id: string;
    status: string;
    currentStepId?: string;
  };
  steps: Array<{
    id: string;
    name: string;
    description: string;
    assignedRole: string;
    progress: {
      status: string;
    };
  }>;
}

function WorkersForClient({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ['/api/clients', clientId, 'workers'],
    enabled: !!clientId,
  });
  
  if (workersLoading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }
  
  if (!workers.length) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="h-4 w-4" />
          <span className="text-sm">No workers assigned to this client</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-4 pt-4 border-t">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded-md transition-colors">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Users className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Workers ({workers.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-3">
            {workers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function WorkerCard({ worker }: { worker: Worker }) {
  const [showWorkflow, setShowWorkflow] = useState(false);
  
  const { data: workflowData = [], isLoading: workflowLoading } = useQuery<WorkflowProgressData[]>({
    queryKey: ['/api/workers', worker.id, 'workflow-progress'],
    enabled: !!worker.id && showWorkflow,
  });
  
  const calculateOverallProgress = (workflows: WorkflowProgressData[]) => {
    if (!workflows.length) return 0;
    const totalSteps = workflows.reduce((acc, workflow) => acc + workflow.steps.length, 0);
    const completedSteps = workflows.reduce((acc, workflow) => 
      acc + workflow.steps.filter(step => step.progress.status === 'COMPLETED').length, 0);
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };
  
  const overallProgress = calculateOverallProgress(workflowData);
  
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-medium text-sm">{worker.firstName} {worker.lastName}</h4>
            <p className="text-xs text-gray-600">{worker.nationality || 'N/A'} • {worker.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={worker.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
            {worker.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWorkflow(!showWorkflow)}
            className="h-6 px-2"
            data-testid={`button-toggle-workflow-${worker.id}`}
          >
            {showWorkflow ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Workflows
          </Button>
        </div>
      </div>
      
      {showWorkflow && (
        <div className="mt-3 pt-3 border-t">
          {workflowLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : workflowData.length === 0 ? (
            <div className="text-center py-4">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">No workflows assigned to this worker</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="w-full h-2" />
              
              <div className="space-y-2">
                {workflowData.map((workflowItem) => {
                  const workflowProgress = workflowItem.steps.length > 0 
                    ? Math.round((workflowItem.steps.filter(step => step.progress.status === 'COMPLETED').length / workflowItem.steps.length) * 100) 
                    : 0;
                  
                  return (
                    <div key={workflowItem.workflow.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">{workflowItem.workflow.name}</h5>
                        <p className="text-xs text-gray-600 truncate">{workflowItem.workflow.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Progress value={workflowProgress} className="w-16 h-1" />
                        <span className="text-xs font-medium text-blue-600 min-w-[2rem]">{workflowProgress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function ClientsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    companyName: '',
    contactPersonName: '',
    email: '',
    phone: '',
    address: '',
    fiscalCode: '',
    registrationNumber: '',
    industry: '',
    status: 'ACTIVE'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
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

  if (!isAuthenticated) {
    return null;
  }

  // Fetch clients from API
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isAuthenticated,
  });

  // Create client mutation (for ADMIN users only)
  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewClient({
        companyName: '',
        contactPersonName: '',
        email: '',
        phone: '',
        address: '',
        fiscalCode: '',
        registrationNumber: '',
        industry: '',
        status: 'ACTIVE'
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    },
  });

  // Filter clients based on search criteria
  const filteredClients = (clients as Client[]).filter((client: Client) => {
    const matchesSearch = !searchTerm || 
      client.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cui?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (companyName: string) => {
    if (!companyName) return 'CL';
    return companyName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleCreateClient = () => {
    createClientMutation.mutate(newClient);
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Clients
            </h1>
            <p className="text-gray-600 mt-2">
              Manage client companies and their immigration needs
            </p>
          </div>
          
          {user?.role === 'ADMIN' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-create-client">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Add a new client company to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={newClient.companyName}
                      onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                      placeholder="e.g., Tech Solutions SRL"
                      data-testid="input-client-company-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPersonName">Contact Person</Label>
                    <Input
                      id="contactPersonName"
                      value={newClient.contactPersonName}
                      onChange={(e) => setNewClient({...newClient, contactPersonName: e.target.value})}
                      placeholder="e.g., John Smith"
                      data-testid="input-client-contact-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        placeholder="contact@company.com"
                        data-testid="input-client-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        placeholder="+40 123 456 789"
                        data-testid="input-client-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select 
                      value={newClient.industry} 
                      onValueChange={(value) => setNewClient({...newClient, industry: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Hospitality">Hospitality</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateClient}
                    disabled={createClientMutation.isPending}
                    data-testid="button-save-client"
                  >
                    {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-clients"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Clients ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedStatus !== 'all'
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No clients have been registered yet. Add client companies to start managing their immigration workflows.'}
                </p>
                {user?.role === 'ADMIN' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-client">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client: Client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1 mr-4">
                          <CardTitle className="text-lg truncate" title={client.legalName}>{client.legalName}</CardTitle>
                          <CardDescription className="truncate" title={`CUI: ${client.cui} | Registration: ${client.registrationNumber}`}>
                            CUI: {client.cui} | Registration: {client.registrationNumber}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/clients/${client.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-view-client-${client.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-edit-client-${client.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 text-sm">
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium text-gray-600 block">Contact:</span>
                          <p className="truncate text-gray-800" title={client.contactEmail}>{client.contactEmail}</p>
                          <p className="truncate text-gray-800" title={client.phoneNumber}>{client.phoneNumber || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium text-gray-600 block">Administrator:</span>
                          <p className="truncate text-gray-800" title={client.adminName}>{client.adminName}</p>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium text-gray-600 block">Registration:</span>
                          <p className="truncate text-gray-800" title={client.registrationNumber}>{client.registrationNumber || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium text-gray-600 block">CAEN Code:</span>
                          <p className="truncate text-gray-800" title={client.caen}>{client.caen || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium text-gray-600 block">Bank IBAN:</span>
                          <p className="truncate text-gray-800" title={client.bankIban}>{client.bankIban || 'N/A'}</p>
                        </div>
                        <div className="space-y-1 min-w-0 md:col-span-2 lg:col-span-3 2xl:col-span-1">
                          <span className="font-medium text-gray-600 block">Legal Address:</span>
                          <p className="truncate text-gray-800" title={client.legalAddress}>{client.legalAddress || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Workers for this client */}
                      <WorkersForClient clientId={client.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}