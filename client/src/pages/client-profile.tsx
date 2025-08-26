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
import { ArrowLeft, Building, Mail, Phone, MapPin, CreditCard, Edit, Save, X, User, Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ClientProfile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  
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
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId && isAuthenticated,
  });

  // Fetch workers for this client  
  const { data: workers, isLoading: workersLoading, error: workersError } = useQuery({
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
    await updateClientMutation.mutateAsync(formData);
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
          <Header />
          
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
                      <Button variant="outline" size="sm" data-testid="button-add-worker">
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
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setLocation(`/workers/${worker.id}`)}
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
                              <div className="text-right">
                                <Badge variant="outline" className="mb-1">
                                  {worker.passportNumber}
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(worker.passportExpiry).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 mb-4">No workers assigned to this client</p>
                          <Button variant="outline" size="sm" data-testid="button-add-first-worker">
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
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}