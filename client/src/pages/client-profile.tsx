import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Building, Mail, Phone, MapPin, CreditCard, Edit, Save, X, User, Plus, Calendar, Globe, CheckCircle, Clock, AlertTriangle, FileText, Upload, Download, Eye } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";

interface WorkerAssignment {
  id: string;
  requirement: {
    id: string;
    title: string;
    description: string;
    stage: {
      key: string;
      title: string;
      order: number;
    };
  };
  status: string;
  documentFiles: {
    id: string;
    fileName: string;
    kind: string;
    createdAt: string;
  }[];
  submittedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

interface SelectedWorkerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  clientProfile: {
    id: string;
    legalName: string;
  };
  assignments: WorkerAssignment[];
}

export default function ClientProfile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isEditingWorker, setIsEditingWorker] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    dob: '',
    passportNumber: '',
    passportExpiry: ''
  });
  const [editedWorkerData, setEditedWorkerData] = useState<any>(null);
  
  // Extract client ID from URL
  const clientId = location.split('/clients/')[1];
  
  // Form states
  const [formData, setFormData] = useState({
    legalName: '',
    cui: '',
    caen: '',
    legalAddress: '',
    contactEmail: '',
    registrationNumber: '',
    phoneNumber: '',
    adminName: '',
    bankIban: ''
  });

  // Fetch client data
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<any>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId && isAuthenticated,
  });

  // Fetch workers for this client  
  const { data: workers, isLoading: workersLoading, error: workersError } = useQuery<any[]>({
    queryKey: ['/api/clients', clientId, 'workers'],
    enabled: !!clientId && isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    }
  });

  // Fetch selected worker details with workflow
  const { data: selectedWorker, isLoading: selectedWorkerLoading, error: selectedWorkerError } = useQuery<any>({
    queryKey: ['/api/workers', selectedWorkerId],
    enabled: !!selectedWorkerId && isAuthenticated,
  });

  // Fetch workflow data for selected worker
  const { data: workerWorkflowData, isLoading: workflowLoading } = useQuery<any>({
    queryKey: ['/api/workflow/worker', selectedWorkerId],
    enabled: !!selectedWorkerId && isAuthenticated,
  });




  // Update worker mutation
  const updateWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/workers/${selectedWorkerId}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update worker");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers', selectedWorkerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      setIsEditingWorker(false);
      setEditedWorkerData(null);
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update worker",
        variant: "destructive",
      });
    },
  });

  // Create worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/workers`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      setIsAddingWorker(false);
      setNewWorkerData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        dob: '',
        passportNumber: '',
        passportExpiry: ''
      });
      toast({
        title: "Success",
        description: "Worker created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating worker:', error);
      toast({
        title: "Error",
        description: "Failed to create worker",
        variant: "destructive",
      });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/clients/${clientId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  });

  // Initialize form data when client data loads
  useEffect(() => {
    if (client) {
      setFormData({
        legalName: client.legalName || '',
        cui: client.cui || '',
        caen: client.caen || '',
        legalAddress: client.legalAddress || '',
        contactEmail: client.contactEmail || '',
        registrationNumber: client.registrationNumber || '',
        phoneNumber: client.phoneNumber || '',
        adminName: client.adminName || '',
        bankIban: client.bankIban || ''
      });
    }
  }, [client]);

  const handleSave = async () => {
    try {
      console.log('Saving client data:', formData);
      await updateClientMutation.mutateAsync(formData);
      setIsEditing(false);
      console.log('Client save successful');
    } catch (error) {
      console.error('Client save error:', error);
    }
  };

  const handleCancel = () => {
    if (client) {
      setFormData({
        legalName: client.legalName || '',
        cui: client.cui || '',
        caen: client.caen || '',
        legalAddress: client.legalAddress || '',
        contactEmail: client.contactEmail || '',
        registrationNumber: client.registrationNumber || '',
        phoneNumber: client.phoneNumber || '',
        adminName: client.adminName || '',
        bankIban: client.bankIban || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar userRole={user.role} onSectionChange={() => {}} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Client Profile" subtitle="Manage client information" />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation('/clients')}
                    data-testid="button-back-to-clients"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Clients
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {clientLoading ? 'Loading...' : client?.legalName || 'Client Profile'}
                      </h1>
                      <p className="text-gray-600">
                        {clientLoading ? '' : `CUI: ${client?.cui || 'N/A'}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      disabled={clientLoading}
                      data-testid="button-edit-client"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateClientMutation.isPending}
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateClientMutation.isPending}
                        data-testid="button-save-client"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {clientLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : clientError ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-red-600">Failed to load client data</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Legal Name
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.legalName}
                            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                            placeholder="Company legal name"
                            data-testid="input-legal-name"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-legal-name">
                            {client?.legalName || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CUI
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.cui}
                              onChange={(e) => setFormData({ ...formData, cui: e.target.value })}
                              placeholder="RO12345678"
                              data-testid="input-cui"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-cui">
                              {client?.cui || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CAEN Code
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.caen}
                              onChange={(e) => setFormData({ ...formData, caen: e.target.value })}
                              placeholder="6201"
                              data-testid="input-caen"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-caen">
                              {client?.caen || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Legal Address
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.legalAddress}
                            onChange={(e) => setFormData({ ...formData, legalAddress: e.target.value })}
                            placeholder="Company registered address"
                            rows={3}
                            data-testid="textarea-legal-address"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-legal-address">
                            {client?.legalAddress || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Number
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.registrationNumber}
                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                            placeholder="J40/15234/2018"
                            data-testid="input-registration-number"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-registration-number">
                            {client?.registrationNumber || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Mail className="h-5 w-5 mr-2" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Administrator Name
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.adminName}
                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                            placeholder="Primary contact person"
                            data-testid="input-admin-name"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-admin-name">
                            {client?.adminName || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            placeholder="contact@company.com"
                            data-testid="input-contact-email"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-contact-email">
                            {client?.contactEmail || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+40 XXX XXX XXX"
                            data-testid="input-phone-number"
                          />
                        ) : (
                          <p className="text-gray-900" data-testid="text-phone-number">
                            {client?.phoneNumber || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank IBAN
                        </label>
                        {isEditing ? (
                          <Input
                            value={formData.bankIban}
                            onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                            placeholder="RO49 AAAA 1B31 0075 9384 0000"
                            data-testid="input-bank-iban"
                          />
                        ) : (
                          <p className="text-gray-900 font-mono" data-testid="text-bank-iban">
                            {client?.bankIban || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workers Section */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>Workers</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        data-testid="button-add-worker"
                        onClick={() => setIsAddingWorker(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Worker
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {workersLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : workers && Array.isArray(workers) && workers.length > 0 ? (
                        <div className="space-y-3">
                          {workers.map((worker) => (
                            <div 
                              key={worker.id} 
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                              data-testid={`worker-card-${worker.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900" data-testid={`worker-name-${worker.id}`}>
                                    {worker.firstName} {worker.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600" data-testid={`worker-nationality-${worker.id}`}>
                                    {worker.nationality} • {worker.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <Badge variant="outline" className="mb-1">
                                  {worker.passportNumber}
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(worker.passportExpiry).toLocaleDateString()}
                                </p>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedWorkerId(worker.id);
                                      // Auto-enable edit mode when selecting worker
                                      setTimeout(() => {
                                        setIsEditingWorker(true);
                                        const workerDataForEdit = {
                                          ...worker,
                                          dob: worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : '',
                                          passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().split('T')[0] : ''
                                        };
                                        setEditedWorkerData(workerDataForEdit);
                                      }, 100);
                                    }}
                                    data-testid={`button-edit-worker-${worker.id}`}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedWorkerId(worker.id);
                                    }}
                                    data-testid={`button-view-worker-${worker.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 mb-4">No workers assigned to this client</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid="button-add-first-worker"
                            onClick={() => setIsAddingWorker(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add First Worker
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status and Statistics */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Client Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600" data-testid="stat-active-workers">
                            {workers?.length || 0}
                          </p>
                          <p className="text-sm text-blue-600">Total Workers</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600" data-testid="stat-completed-cases">
                            {client?.completedCases || 0}
                          </p>
                          <p className="text-sm text-green-600">Completed Cases</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-cases">
                            {client?.pendingCases || 0}
                          </p>
                          <p className="text-sm text-yellow-600">Pending Cases</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <Badge 
                            variant={client?.status === 'active' ? 'default' : 'secondary'}
                            data-testid="badge-client-status"
                          >
                            {(client?.status || 'active').toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-2">Status</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Worker Details Section */}
                  {selectedWorkerId && (
                    <Card className="lg:col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center space-x-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedWorkerId(null)}
                            data-testid="button-close-worker-details"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div>
                            <CardTitle className="text-xl">
                              {selectedWorker ? `${selectedWorker.firstName} ${selectedWorker.lastName}` : 'Worker Details'}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Worker Details & Immigration Workflow
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isEditingWorker ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditingWorker(true);
                                // Format dates for input fields when starting edit
                                const workerDataForEdit = {
                                  ...selectedWorker,
                                  dob: selectedWorker.dob ? new Date(selectedWorker.dob).toISOString().split('T')[0] : '',
                                  passportExpiry: selectedWorker.passportExpiry ? new Date(selectedWorker.passportExpiry).toISOString().split('T')[0] : ''
                                };
                                setEditedWorkerData(workerDataForEdit);
                              }}
                              data-testid="button-edit-worker"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Worker
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditingWorker(false);
                                  setEditedWorkerData(null);
                                }}
                                disabled={updateWorkerMutation.isPending}
                                data-testid="button-cancel-worker-edit"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (editedWorkerData) {
                                    // Send date strings as-is, backend will handle conversion
                                    console.log('Sending worker data:', editedWorkerData);
                                    const dataToSend = {
                                      ...editedWorkerData,
                                      dob: editedWorkerData.dob || undefined,
                                      passportExpiry: editedWorkerData.passportExpiry || undefined
                                    };
                                    updateWorkerMutation.mutate(dataToSend);
                                  }
                                }}
                                disabled={updateWorkerMutation.isPending}
                                data-testid="button-save-worker"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                {updateWorkerMutation.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {selectedWorkerLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        ) : (
                          <>
                            {/* Show workflow even if worker data is missing */}
                            {!selectedWorker && (
                              <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
                                Worker personal data not found, but showing workflow configuration below.
                              </div>
                            )}
                            
                            {/* Personal Information - only show if worker data exists */}
                            {selectedWorker && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                  Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      First Name
                                    </label>
                                    {isEditingWorker && editedWorkerData ? (
                                      <Input
                                        value={editedWorkerData.firstName}
                                        onChange={(e) => setEditedWorkerData({ ...editedWorkerData, firstName: e.target.value })}
                                        data-testid="input-worker-first-name"
                                      />
                                    ) : (
                                      <p className="text-gray-900" data-testid="text-worker-first-name">
                                        {selectedWorker.firstName}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Last Name
                                    </label>
                                    {isEditingWorker && editedWorkerData ? (
                                      <Input
                                        value={editedWorkerData.lastName}
                                        onChange={(e) => setEditedWorkerData({ ...editedWorkerData, lastName: e.target.value })}
                                        data-testid="input-worker-last-name"
                                      />
                                    ) : (
                                      <p className="text-gray-900" data-testid="text-worker-last-name">
                                        {selectedWorker.lastName}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nationality
                                  </label>
                                  {isEditingWorker && editedWorkerData ? (
                                    <Input
                                      value={editedWorkerData.nationality}
                                      onChange={(e) => setEditedWorkerData({ ...editedWorkerData, nationality: e.target.value })}
                                      data-testid="input-worker-nationality"
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Globe className="h-4 w-4 text-gray-500" />
                                      <p className="text-gray-900" data-testid="text-worker-nationality">
                                        {selectedWorker.nationality}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth
                                  </label>
                                  {isEditingWorker && editedWorkerData ? (
                                    <Input
                                      type="date"
                                      value={editedWorkerData.dob}
                                      onChange={(e) => setEditedWorkerData({ ...editedWorkerData, dob: e.target.value })}
                                      data-testid="input-worker-dob"
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <p className="text-gray-900" data-testid="text-worker-dob">
                                        {new Date(selectedWorker.dob).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                  Contact & Document Info
                                </h3>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                  </label>
                                  {isEditingWorker && editedWorkerData ? (
                                    <Input
                                      type="email"
                                      value={editedWorkerData.email}
                                      onChange={(e) => setEditedWorkerData({ ...editedWorkerData, email: e.target.value })}
                                      data-testid="input-worker-email"
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Mail className="h-4 w-4 text-gray-500" />
                                      <p className="text-gray-900" data-testid="text-worker-email">
                                        {selectedWorker.email}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                  </label>
                                  {isEditingWorker && editedWorkerData ? (
                                    <Input
                                      value={editedWorkerData.phone}
                                      onChange={(e) => setEditedWorkerData({ ...editedWorkerData, phone: e.target.value })}
                                      data-testid="input-worker-phone"
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="h-4 w-4 text-gray-500" />
                                      <p className="text-gray-900" data-testid="text-worker-phone">
                                        {selectedWorker.phone}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Passport Number
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                    <Badge variant="outline" data-testid="badge-worker-passport">
                                      {selectedWorker.passportNumber}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Passport Expires
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <p className="text-gray-900" data-testid="text-worker-passport-expiry">
                                      {new Date(selectedWorker.passportExpiry).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}

                            {/* Immigration Workflow */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                {workerWorkflowData?.name || 'Workflow Status'}
                              </h3>
                              {workerWorkflowData?.description && (
                                <p className="text-sm text-gray-600 -mt-2 mb-4">{workerWorkflowData.description}</p>
                              )}
                              
                              
                              {workflowLoading ? (
                                <div className="flex items-center justify-center p-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  <span className="ml-2 text-gray-600">Loading workflow data...</span>
                                </div>
                              ) : workerWorkflowData && workerWorkflowData.stages && workerWorkflowData.stages.length > 0 ? (
                                <div className="space-y-4">
                                  {/* Display workflow stages from settings */}
                                  {workerWorkflowData.stages.map((stage: any, index: number) => (
                                    <Card key={stage.id} className="border-l-4 border-l-blue-500">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-base">
                                          <span className="flex items-center space-x-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <span>{stage.name}</span>
                                            <Badge variant="outline" className="ml-2">
                                              Stage {index + 1}
                                            </Badge>
                                            <Badge 
                                              variant={stage.status === 'in-progress' ? 'default' : 'secondary'}
                                              className="ml-2"
                                            >
                                              {stage.status || 'pending'}
                                            </Badge>
                                          </span>
                                          <div className="text-sm text-gray-600">
                                            {stage.documentRequirements?.length || 0} requirement{(stage.documentRequirements?.length || 0) !== 1 ? 's' : ''}
                                          </div>
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        {stage.documentRequirements && stage.documentRequirements.length > 0 ? (
                                          stage.documentRequirements.map((doc: any) => (
                                            <div 
                                              key={doc.id} 
                                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                              data-testid={`document-${doc.id}`}
                                            >
                                            <div className="flex-1">
                                              <h4 className="font-medium text-gray-900">
                                                {doc.title}
                                              </h4>
                                              <p className="text-sm text-gray-600 mt-1">
                                                {doc.description}
                                              </p>
                                              <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center space-x-2">
                                                  {doc.status === 'completed' && (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                  )}
                                                  {doc.status === 'in-review' && (
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                  )}
                                                  {doc.status === 'pending' && (
                                                    <Upload className="h-4 w-4 text-blue-600" />
                                                  )}
                                                  {doc.status === 'not-started' && (
                                                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                                                  )}
                                                  <Badge 
                                                    variant={
                                                      doc.status === 'completed' ? 'default' : 
                                                      doc.status === 'in-review' ? 'secondary' :
                                                      doc.status === 'pending' ? 'outline' :
                                                      'outline'
                                                    }
                                                    className="text-xs"
                                                    data-testid={`status-${doc.id}`}
                                                  >
                                                    {doc.status || 'not-started'}
                                                  </Badge>
                                                </div>
                                                
                                                {doc.uploadedFiles && doc.uploadedFiles.length > 0 && (
                                                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                    <FileText className="h-4 w-4" />
                                                    <span>{doc.uploadedFiles.length} file{doc.uploadedFiles.length !== 1 ? 's' : ''}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="flex space-x-2">
                                              {doc.status === 'pending' && (
                                                <Button size="sm" variant="outline" data-testid={`button-upload-${doc.id}`}>
                                                  <Upload className="h-4 w-4 mr-1" />
                                                  Upload
                                                </Button>
                                              )}
                                              {doc.uploadedFiles && doc.uploadedFiles.length > 0 && (
                                                <Button size="sm" variant="outline" data-testid={`button-view-docs-${doc.id}`}>
                                                  <Eye className="h-4 w-4 mr-1" />
                                                  View Docs
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          ))
                                        ) : (
                                          <div className="text-center py-4 text-gray-500">
                                            No document requirements for this stage
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-600">No workflow data found for this worker</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Worker Creation Dialog */}
      <Dialog open={isAddingWorker} onOpenChange={setIsAddingWorker}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="worker-creation-description">
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
            <p id="worker-creation-description" className="sr-only">Fill in the form below to add a new worker to this client</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={newWorkerData.firstName}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  data-testid="input-new-worker-first-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  value={newWorkerData.lastName}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  data-testid="input-new-worker-last-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newWorkerData.email}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="input-new-worker-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  value={newWorkerData.phone}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, phone: e.target.value })}
                  placeholder="+40 XXX XXX XXX"
                  data-testid="input-new-worker-phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality *
                </label>
                <Input
                  value={newWorkerData.nationality}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, nationality: e.target.value })}
                  placeholder="Enter nationality"
                  data-testid="input-new-worker-nationality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  value={newWorkerData.dob}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, dob: e.target.value })}
                  data-testid="input-new-worker-dob"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Number *
                </label>
                <Input
                  value={newWorkerData.passportNumber}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, passportNumber: e.target.value })}
                  placeholder="Enter passport number"
                  data-testid="input-new-worker-passport"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Expiry *
                </label>
                <Input
                  type="date"
                  value={newWorkerData.passportExpiry}
                  onChange={(e) => setNewWorkerData({ ...newWorkerData, passportExpiry: e.target.value })}
                  data-testid="input-new-worker-passport-expiry"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingWorker(false);
                setNewWorkerData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  nationality: '',
                  dob: '',
                  passportNumber: '',
                  passportExpiry: ''
                });
              }}
              data-testid="button-cancel-new-worker"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const workerDataToSend = {
                  ...newWorkerData,
                  dob: newWorkerData.dob ? new Date(newWorkerData.dob).toISOString() : undefined,
                  passportExpiry: newWorkerData.passportExpiry ? new Date(newWorkerData.passportExpiry).toISOString() : undefined
                };
                createWorkerMutation.mutate(workerDataToSend);
              }}
              disabled={createWorkerMutation.isPending || !newWorkerData.firstName || !newWorkerData.lastName || !newWorkerData.email}
              data-testid="button-save-new-worker"
            >
              {createWorkerMutation.isPending ? 'Creating...' : 'Create Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}