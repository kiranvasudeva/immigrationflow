import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
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
  Trash2,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import WorkerList from '@/components/workers/worker-list';
import { WorkerWorkflowDisplay } from '@/components/shared/WorkerWorkflowDisplay';
import ClientWorkersDisplay from '@/components/clients/ClientWorkersDisplay';

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
  const [, setLocation] = useLocation();
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

  // Delete client mutation (for ADMIN users only)
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
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
                      <Link href={`/clients/${client.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-view-profile-${client.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
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
                        <Users className="h-4 w-4 mr-1" />
                        {showClientWorkers[client.id] ? 'Hide Workers' : 'View Workers'}
                      </Button>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('Edit button clicked for client:', client.id);
                              console.log('Client data:', client);
                              setEditClientForm({
                                legalName: client.legalName || '',
                                registrationNumber: client.registrationNumber || '',
                                cui: client.cui || '',
                                legalAddress: client.legalAddress || '',
                                adminName: client.adminName || '',
                                contactEmail: client.contactEmail || '',
                                phoneNumber: client.phoneNumber || '',
                                bankIban: client.bankIban || '',
                                caen: client.caen || ''
                              });
                              setEditingClient(client.id);
                              console.log('Edit form state set, editingClient:', client.id);
                            }}
                            data-testid={`button-edit-client-${client.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-client-${client.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Client</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{client.legalName}"? This action cannot be undone.
                                  All associated workers and assignments will also be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid={`button-cancel-delete-client-${client.id}`}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteClientMutation.mutate(client.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deleteClientMutation.isPending}
                                  data-testid={`button-confirm-delete-client-${client.id}`}
                                >
                                  {deleteClientMutation.isPending ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
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
              <CardTitle className="text-lg text-blue-800">Edit Client (ID: {editingClient})</CardTitle>
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

