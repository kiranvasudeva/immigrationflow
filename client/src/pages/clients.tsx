import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/I18nProvider';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  ChevronDown,
  ChevronRight,
  Users,
  UserCheck,
  X,
  FileText,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import WorkerList from '@/components/workers/worker-list';
import { WorkerWorkflowDisplay } from '@/components/shared/WorkerWorkflowDisplay';

interface Client {
  id: string;
  legalName: string;
  cui: string;
  registrationNumber: string;
  contactEmail: string;
  phoneNumber: string;
  adminName: string;
  legalAddress: string;
  bankIban: string;
  caen: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [showClientWorkers, setShowClientWorkers] = useState<Record<string, boolean>>({});
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [newClientForm, setNewClientForm] = useState({
    legalName: '',
    cui: '',
    registrationNumber: '',
    contactEmail: '',
    phoneNumber: '',
    adminName: '',
    legalAddress: '',
    bankIban: '',
    caen: ''
  });
  const [editClientForm, setEditClientForm] = useState({
    legalName: '',
    cui: '',
    registrationNumber: '',
    contactEmail: '',
    phoneNumber: '',
    adminName: '',
    legalAddress: '',
    bankIban: '',
    caen: ''
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
      setShowNewClientForm(false);
      setNewClientForm({
        legalName: '',
        cui: '',
        registrationNumber: '',
        contactEmail: '',
        phoneNumber: '',
        adminName: '',
        legalAddress: '',
        bankIban: '',
        caen: ''
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

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setEditingClient(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const filteredClients = (clients as Client[]).filter((client: Client) => {
    const searchLower = clientSearchTerm.toLowerCase();
    return !clientSearchTerm || 
      client.legalName?.toLowerCase().includes(searchLower) ||
      client.contactEmail?.toLowerCase().includes(searchLower) ||
      client.cui?.toLowerCase().includes(searchLower) ||
      client.registrationNumber?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients & Workers</h1>
            <p className="text-muted-foreground">
              Manage client organizations and their immigration workforce
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <Button 
              onClick={() => setShowNewClientForm(true)}
              disabled={showNewClientForm}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>

        {/* Search Section */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 hover:bg-transparent">
              <ChevronDown className="h-4 w-4" />
              <h2 className="text-xl font-semibold">Search & Filter</h2>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search clients by name, CUI, or registration number..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Add New Client Form */}
        {showNewClientForm && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Add New Client</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                createClientMutation.mutate(newClientForm);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      value={newClientForm.legalName}
                      onChange={(e) => setNewClientForm({...newClientForm, legalName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cui">CUI</Label>
                    <Input
                      id="cui"
                      value={newClientForm.cui}
                      onChange={(e) => setNewClientForm({...newClientForm, cui: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={newClientForm.registrationNumber}
                      onChange={(e) => setNewClientForm({...newClientForm, registrationNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={newClientForm.contactEmail}
                      onChange={(e) => setNewClientForm({...newClientForm, contactEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={newClientForm.phoneNumber}
                      onChange={(e) => setNewClientForm({...newClientForm, phoneNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input
                      id="adminName"
                      value={newClientForm.adminName}
                      onChange={(e) => setNewClientForm({...newClientForm, adminName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="legalAddress">Legal Address</Label>
                    <Textarea
                      id="legalAddress"
                      value={newClientForm.legalAddress}
                      onChange={(e) => setNewClientForm({...newClientForm, legalAddress: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankIban">Bank IBAN</Label>
                    <Input
                      id="bankIban"
                      value={newClientForm.bankIban}
                      onChange={(e) => setNewClientForm({...newClientForm, bankIban: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="caen">CAEN Code</Label>
                    <Input
                      id="caen"
                      value={newClientForm.caen}
                      onChange={(e) => setNewClientForm({...newClientForm, caen: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewClientForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClientMutation.isPending}>
                    {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600">
                  {clientSearchTerm ? 'Try adjusting your search criteria.' : 'Start by adding your first client.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client: any) => (
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowClientWorkers(prev => ({
                            ...prev,
                            [client.id]: !prev[client.id]
                          }));
                        }}
                        data-testid={`button-view-workers-${client.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {showClientWorkers[client.id] ? 'Hide Workers' : 'View Workers'}
                      </Button>
                      {user?.role === 'ADMIN' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditClientForm({
                              legalName: client.legalName,
                              registrationNumber: client.registrationNumber,
                              cui: client.cui,
                              legalAddress: client.legalAddress,
                              adminName: client.adminName,
                              contactEmail: client.contactEmail,
                              phoneNumber: client.phoneNumber,
                              bankIban: client.bankIban,
                              caen: client.caen
                            });
                            setEditingClient(client.id);
                          }}
                          data-testid={`button-edit-client-${client.id}`}
                        >
                          <Edit className="h-4 w-4" />
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
                      <p className="truncate text-gray-800" title={client.phoneNumber}>{client.phoneNumber}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="font-medium text-gray-600 block">Administrator:</span>
                      <p className="truncate text-gray-800" title={client.adminName}>{client.adminName}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="font-medium text-gray-600 block">Registration:</span>
                      <p className="truncate text-gray-800" title={client.registrationNumber}>{client.registrationNumber}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="font-medium text-gray-600 block">CAEN Code:</span>
                      <p className="truncate text-gray-800" title={client.caen}>{client.caen}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="font-medium text-gray-600 block">Bank IBAN:</span>
                      <p className="truncate text-gray-800" title={client.bankIban}>{client.bankIban}</p>
                    </div>
                    <div className="space-y-1 min-w-0 md:col-span-2 lg:col-span-3 2xl:col-span-1">
                      <span className="font-medium text-gray-600 block">Legal Address:</span>
                      <p className="truncate text-gray-800" title={client.legalAddress}>{client.legalAddress}</p>
                    </div>
                  </div>

                  {/* Inline Worker Display */}
                  {showClientWorkers[client.id] && (
                    <ClientWorkersDisplay 
                      clientId={client.id}
                      selectedWorker={selectedWorker}
                      setSelectedWorker={setSelectedWorker}
                      isAuthenticated={isAuthenticated}
                      user={user}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>


        {/* Edit Client Form */}
        {editingClient && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Edit Client</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateClientMutation.mutate({ id: editingClient, data: editClientForm });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editLegalName">Legal Name</Label>
                    <Input
                      id="editLegalName"
                      value={editClientForm.legalName}
                      onChange={(e) => setEditClientForm({...editClientForm, legalName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCui">CUI</Label>
                    <Input
                      id="editCui"
                      value={editClientForm.cui}
                      onChange={(e) => setEditClientForm({...editClientForm, cui: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRegistrationNumber">Registration Number</Label>
                    <Input
                      id="editRegistrationNumber"
                      value={editClientForm.registrationNumber}
                      onChange={(e) => setEditClientForm({...editClientForm, registrationNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editContactEmail">Contact Email</Label>
                    <Input
                      id="editContactEmail"
                      type="email"
                      value={editClientForm.contactEmail}
                      onChange={(e) => setEditClientForm({...editClientForm, contactEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhoneNumber">Phone Number</Label>
                    <Input
                      id="editPhoneNumber"
                      value={editClientForm.phoneNumber}
                      onChange={(e) => setEditClientForm({...editClientForm, phoneNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editAdminName">Admin Name</Label>
                    <Input
                      id="editAdminName"
                      value={editClientForm.adminName}
                      onChange={(e) => setEditClientForm({...editClientForm, adminName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="editLegalAddress">Legal Address</Label>
                    <Textarea
                      id="editLegalAddress"
                      value={editClientForm.legalAddress}
                      onChange={(e) => setEditClientForm({...editClientForm, legalAddress: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBankIban">Bank IBAN</Label>
                    <Input
                      id="editBankIban"
                      value={editClientForm.bankIban}
                      onChange={(e) => setEditClientForm({...editClientForm, bankIban: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCaen">CAEN Code</Label>
                    <Input
                      id="editCaen"
                      value={editClientForm.caen}
                      onChange={(e) => setEditClientForm({...editClientForm, caen: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingClient(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClientMutation.isPending}>
                    {updateClientMutation.isPending ? 'Updating...' : 'Update Client'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Component for displaying workers for a specific client (copied from Dashboard)
function ClientWorkersDisplay({ clientId, selectedWorker, setSelectedWorker, isAuthenticated, user }: { 
  clientId: string; 
  selectedWorker: any; 
  setSelectedWorker: (worker: any) => void; 
  isAuthenticated: boolean;
  user: any;
}) {
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'workers'],
  });

  // Fetch worker workflow data for selected worker
  const { data: selectedWorkerWorkflowData, isLoading: workflowLoading } = useQuery({
    queryKey: ['/api/workflow/worker', selectedWorker?.id],
    enabled: !!selectedWorker?.id && isAuthenticated,
  });

  // Filter workers based on search term
  const filteredWorkers = (workers as any[]).filter((worker: any) => {
    const matchesSearch = !workerSearchTerm || 
      worker.firstName.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      worker.lastName.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      worker.nationality.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      worker.passportNumber.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
      (worker.email && worker.email.toLowerCase().includes(workerSearchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-600">Loading workers...</span>
        </div>
      </div>
    );
  }

  if ((workers as any[]).length === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="text-center py-6">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers</h3>
          <p className="text-gray-600">No workers have been assigned to this client yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Workers ({(workers as any[]).length})</h4>
      </div>

      {/* Worker Search Filter */}
      <div className="mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search workers..."
            value={workerSearchTerm}
            onChange={(e) => setWorkerSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-workers"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-4">
            <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {workerSearchTerm ? 'No workers match your search criteria.' : 'No workers found.'}
            </p>
          </div>
        ) : (
          filteredWorkers.map((worker: any) => (
          <div key={worker.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">
                  {worker.firstName} {worker.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {worker.nationality} • Passport: {worker.passportNumber}
                </div>
                {worker.email && (
                  <div className="text-sm text-gray-600">{worker.email}</div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)}
                  data-testid={`button-view-workflow-${worker.id}`}
                >
                  {selectedWorker?.id === worker.id ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      View Workflow
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Worker Workflow Details */}
            {selectedWorker?.id === worker.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="font-medium text-gray-900 mb-3">Workflow Status</h5>
                
                <WorkerWorkflowDisplay 
                  workerId={selectedWorker.id}
                  workflowData={selectedWorkerWorkflowData}
                  isLoading={workflowLoading}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                />
              </div>
            )}
          </div>
        ))
        )}
      </div>
    </div>
  );
}