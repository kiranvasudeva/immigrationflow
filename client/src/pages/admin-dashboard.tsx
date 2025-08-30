import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Save, 
  X, 
  Eye, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Building2,
  Search,
  Filter,
  Upload,
  Download
} from "lucide-react";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentViewer } from "@/components/documents/DocumentViewer";

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
  const [showClientWorkers, setShowClientWorkers] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
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
    dob: '',
    passportNumber: '',
    passportExpiry: '',
    email: '',
    phone: '',
    assignedWorkflowIds: [] as string[]
  });

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


  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch data
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isAuthenticated
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
    enabled: isAuthenticated
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['/api/stages'],
    enabled: isAuthenticated
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/dashboard/assignments'],
    enabled: isAuthenticated
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client created successfully",
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest("PUT", `/api/clients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setEditingClient(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter clients based on search term
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = !clientSearchTerm || 
      client.legalName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.contactEmail.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.cui.toLowerCase().includes(clientSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage clients, workers, and immigration workflows</p>
          </div>
        </div>

        {/* Dashboard Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWorkers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeWorkers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingActions}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Clients Section */}
          <div className="lg:col-span-2">
            <Collapsible open={clientsOpen} onOpenChange={setClientsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Clients Management</h2>
                  </div>
                  {clientsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-6 mt-6">
                {/* Client Search and Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search clients..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-clients"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowNewClientForm(true)}
                    className="whitespace-nowrap"
                    data-testid="button-add-client"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </div>

                {/* New Client Form */}
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
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{client.legalName}</CardTitle>
                              <CardDescription>
                                CUI: {client.cui} | Registration: {client.registrationNumber}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowClientWorkers(true);
                                }}
                                data-testid={`button-view-workers-${client.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Workers
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedClient(client);
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
                                  setEditingClient(true);
                                }}
                                data-testid={`button-edit-client-${client.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Contact:</span>
                              <p>{client.contactEmail}</p>
                              <p>{client.phoneNumber}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Administrator:</span>
                              <p>{client.adminName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">CAEN:</span>
                              <p>{client.caen}</p>
                            </div>
                          </div>

                          {/* Client Edit Form */}
                          {editingClient && selectedClient?.id === client.id && (
                            <div className="mt-6 p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                              <h4 className="font-semibold text-yellow-800 mb-4">Edit Client Information</h4>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                updateClientMutation.mutate({ id: client.id, ...editClientForm });
                              }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-legalName">Legal Name</Label>
                                    <Input
                                      id="edit-legalName"
                                      value={editClientForm.legalName}
                                      onChange={(e) => setEditClientForm({...editClientForm, legalName: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-cui">CUI</Label>
                                    <Input
                                      id="edit-cui"
                                      value={editClientForm.cui}
                                      onChange={(e) => setEditClientForm({...editClientForm, cui: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-contactEmail">Contact Email</Label>
                                    <Input
                                      id="edit-contactEmail"
                                      type="email"
                                      value={editClientForm.contactEmail}
                                      onChange={(e) => setEditClientForm({...editClientForm, contactEmail: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                                    <Input
                                      id="edit-phoneNumber"
                                      value={editClientForm.phoneNumber}
                                      onChange={(e) => setEditClientForm({...editClientForm, phoneNumber: e.target.value})}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setEditingClient(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={updateClientMutation.isPending}>
                                    {updateClientMutation.isPending ? 'Updating...' : 'Update Client'}
                                  </Button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* Workers Display */}
                          {showClientWorkers && selectedClient?.id === client.id && (
                            <ClientWorkersDisplay 
                              clientId={client.id}
                              selectedWorker={selectedWorker}
                              setSelectedWorker={setSelectedWorker}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Workflow Activity Panel */}
          <div className="space-y-6">
            <Collapsible open={workflowOpen} onOpenChange={setWorkflowOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Workflow Activity</h2>
                  </div>
                  {workflowOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-6">
                {assignments.slice(0, 5).map((assignment: any) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{assignment.requirement?.title}</span>
                        <Badge variant={
                          assignment.status === 'COMPLETED' ? 'default' :
                          assignment.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                        }>
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignment.clientProfile?.legalName}
                        {assignment.worker && ` • ${assignment.worker.firstName} ${assignment.worker.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assignment.stage?.title}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {assignments.length === 0 && (
                  <Card className="p-6 text-center">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No recent workflow activity</p>
                  </Card>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for displaying workers for a specific client
function ClientWorkersDisplay({ clientId, selectedWorker, setSelectedWorker }: { 
  clientId: string; 
  selectedWorker: any; 
  setSelectedWorker: (worker: any) => void; 
}) {
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'workers'],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/dashboard/assignments'],
    enabled: !!selectedWorker
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

  if (workers.length === 0) {
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

  // Get worker-specific assignments
  const workerAssignments = selectedWorker ? 
    assignments.filter((assignment: any) => assignment.workerId === selectedWorker.id) : [];

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Workers ({workers.length})</h4>
      </div>
      
      <div className="space-y-3">
        {workers.map((worker: any) => (
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
                <h5 className="font-medium text-gray-900 mb-3">Immigration Workflow Status</h5>
                
                {workerAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {workerAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{assignment.requirement?.title}</div>
                          <Badge variant={
                            assignment.status === 'ACCEPTED' ? 'default' :
                            assignment.status === 'SUBMITTED_BY_USER' ? 'secondary' :
                            assignment.status === 'RECEIVED_BY_ADMIN' ? 'outline' :
                            assignment.status === 'REJECTED' ? 'destructive' : 'outline'
                          }>
                            {assignment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-3">
                          Stage: {assignment.stage?.title}
                        </div>

                        {/* Document Management for this assignment */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-gray-700">Documents</h6>
                            <DocumentUploader 
                              assignmentId={assignment.id}
                              onUploadComplete={() => {
                                // Refresh documents after upload
                              }}
                            />
                          </div>
                          
                          <DocumentViewer assignmentId={assignment.id} />
                        </div>

                        {assignment.submittedAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No workflow assignments found for this worker</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}