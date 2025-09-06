import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus,
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  FileText,
  User,
  Calendar,
  CreditCard,
  Globe
} from "lucide-react";

export default function ClientProfile() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Extract client ID from URL
  const clientId = location.split('/').pop();

  // Fetch client data
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Find the selected client
  const selectedClient = clients?.find((c: any) => c.id === parseInt(clientId || '0'));

  // Fetch workers for this client
  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['/api/workers', 'client', selectedClient?.id],
    enabled: !!selectedClient,
  });

  // State for worker selection and modal
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Create worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: async (workerData: any) => {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workerData, clientId: selectedClient.id })
      });
      if (!response.ok) throw new Error('Failed to create worker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setIsAddingWorker(false);
      setNewWorkerData({ firstName: '', lastName: '', email: '', phone: '' });
    }
  });

  if (!clientId || !selectedClient) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/clients')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Button>
        </div>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/clients')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </Button>
        
        <Dialog open={isAddingWorker} onOpenChange={setIsAddingWorker}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
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
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={newWorkerData.phone}
                    onChange={(e) => setNewWorkerData({ ...newWorkerData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingWorker(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createWorkerMutation.mutate(newWorkerData)}
                  disabled={createWorkerMutation.isPending || !newWorkerData.firstName || !newWorkerData.lastName || !newWorkerData.email}
                >
                  {createWorkerMutation.isPending ? 'Creating...' : 'Create Worker'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Client Information */}
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>{selectedClient.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClient.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{selectedClient.email}</span>
                </div>
              )}
              {selectedClient.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{selectedClient.phone}</span>
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{selectedClient.address}</span>
                </div>
              )}
              {selectedClient.industry && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{selectedClient.industry}</span>
                </div>
              )}
              {selectedClient.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedClient.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workers List */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span>Workers ({workers?.length || 0})</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading workers...</span>
                </div>
              ) : workers && workers.length > 0 ? (
                <div className="space-y-3">
                  {workers.map((worker: any) => (
                    <div
                      key={worker.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorker?.id === worker.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {worker.firstName} {worker.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{worker.email}</p>
                        </div>
                        <Badge variant="outline">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No workers found</p>
                  <p className="text-sm text-gray-500">Add workers to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Worker Details */}
        <div className="col-span-7">
          {selectedWorker ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span>{selectedWorker.firstName} {selectedWorker.lastName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedWorker.email}</span>
                    </div>
                    {selectedWorker.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{selectedWorker.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passport Information */}
                {selectedWorker.passportNumber && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                      Passport Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport Number
                        </label>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <Badge variant="outline">
                            {selectedWorker.passportNumber}
                          </Badge>
                        </div>
                      </div>
                      {selectedWorker.passportExpiry && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passport Expires
                          </label>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <p className="text-gray-900">
                              {new Date(selectedWorker.passportExpiry).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assigned Workflows - Simple Display */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                    Assigned Workflows
                  </h3>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Workflow display will be implemented here</p>
                    <p className="text-sm">This section shows assigned immigration workflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Worker</h3>
                <p className="text-gray-600">Choose a worker from the list to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}