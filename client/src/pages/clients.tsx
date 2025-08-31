import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Client {
  id: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  phone?: string;
  address?: string;
  fiscalCode?: string;
  registrationNumber?: string;
  industry?: string;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
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

// Component for hierarchical client-workers view
function ClientWithWorkersView({ client, userRole }: { client: Client; userRole: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  
  // Fetch workers for this client
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['/api/clients', client.id, 'workers'],
    enabled: isExpanded,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      case 'SUSPENDED':
        return <Badge variant="secondary">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return 'WR';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="border-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://avatar.vercel.sh/${client.email}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {client.companyName ? client.companyName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) : 'CL'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{client.companyName}</h3>
                    {getStatusBadge(client.status)}
                  </div>
                  <p className="text-sm text-gray-600">{client.contactPersonName}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </span>
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.industry && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {client.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {workersLoading ? '...' : `${(workers as any[]).length} workers`}
                </Badge>
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {workersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span className="text-gray-600">Loading workers...</span>
              </div>
            ) : (workers as Worker[]).length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No workers assigned to this client yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Workers ({(workers as Worker[]).length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(workers as Worker[]).map((worker: Worker) => (
                    <WorkerCard 
                      key={worker.id} 
                      worker={worker} 
                      userRole={userRole}
                      isSelected={selectedWorker === worker.id}
                      onSelect={() => setSelectedWorker(selectedWorker === worker.id ? null : worker.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Component for individual worker with workflow stages
function WorkerCard({ worker, userRole, isSelected, onSelect }: { 
  worker: Worker; 
  userRole: string; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  // Fetch worker workflow data
  const { data: workflowData, isLoading: workflowLoading } = useQuery({
    queryKey: ['/api/workers', worker.id, 'workflow-progress'],
    enabled: isSelected,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      case 'SUSPENDED':
        return <Badge variant="secondary">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return 'WR';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isWorkPermitExpiring = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <Card className={`border transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${worker.email}`} />
              <AvatarFallback>{getInitials(worker.firstName, worker.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">
                {worker.firstName} {worker.lastName}
              </h5>
              <p className="text-sm text-gray-600">{worker.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            data-testid={`button-toggle-worker-${worker.id}`}
          >
            {isSelected ? 'Hide' : 'View'} Workspace
          </Button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            {getStatusBadge(worker.status)}
          </div>
          
          {worker.nationality && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              {worker.nationality}
            </div>
          )}
          
          {worker.passportNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-3 w-3" />
              Passport: {worker.passportNumber}
            </div>
          )}
          
          {worker.currentWorkPermitExpiry && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3" />
              <span className={isWorkPermitExpiring(worker.currentWorkPermitExpiry) ? "text-red-600 font-medium" : "text-gray-600"}>
                Expires: {new Date(worker.currentWorkPermitExpiry).toLocaleDateString()}
              </span>
              {isWorkPermitExpiring(worker.currentWorkPermitExpiry) && (
                <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
              )}
            </div>
          )}
        </div>

        {/* Workflow Progress Section */}
        {isSelected && (
          <div className="border-t pt-3 mt-3">
            <h6 className="font-medium text-gray-900 mb-3">Immigration Workflow Progress</h6>
            {workflowLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-gray-600">Loading workflow data...</span>
              </div>
            ) : workflowData && (workflowData as any).stages && (workflowData as any).stages.length > 0 ? (
              <div className="space-y-3">
                {((workflowData as any).stages || []).map((stage: any, index: number) => (
                  <div key={stage.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stage.status === 'COMPLETED' ? 'bg-green-500' :
                        stage.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                        stage.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-sm font-medium">{stage.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.status === 'COMPLETED' && (
                        <Badge variant="default" className="bg-green-500 text-xs">Complete</Badge>
                      )}
                      {stage.status === 'IN_PROGRESS' && (
                        <Badge variant="default" className="bg-blue-500 text-xs">In Progress</Badge>
                      )}
                      {stage.status === 'PENDING' && (
                        <Badge variant="default" className="bg-yellow-500 text-xs">Pending</Badge>
                      )}
                      {stage.deadline && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(stage.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No workflow stages assigned yet.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Link href={`/workers/${worker.id}`}>
            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-worker-${worker.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          {userRole === 'ADMIN' && (
            <Button variant="outline" size="sm" data-testid={`button-edit-worker-${worker.id}`}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
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
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.fiscalCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    const matchesIndustry = selectedIndustry === 'all' || client.industry === selectedIndustry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
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
              {t('pages.clients.title') || 'Clients'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.clients.description') || 'Manage client companies and their immigration needs'}
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
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
                  {searchTerm || selectedStatus !== 'all' || selectedIndustry !== 'all' 
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
              <div className="space-y-6">
                {filteredClients.map((client: Client) => (
                  <ClientWithWorkersView 
                    key={client.id} 
                    client={client} 
                    userRole={user?.role || 'VIEWER'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}