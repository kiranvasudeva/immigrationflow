import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/I18nProvider';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  AlertCircle,
  Search,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import WorkerForm from '@/components/forms/worker-form';
import { WorkerWorkflowDisplay } from '@/components/shared/WorkerWorkflowDisplay';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  nationality: string;
  passportNumber: string;
  dob?: Date;
  passportExpiry?: Date;
  createdAt: string;
}

interface ClientWorkersDisplayProps {
  clientId: string;
  selectedWorker?: any;
  setSelectedWorker?: (worker: any) => void;
  isAuthenticated: boolean;
  user?: any;
}

export default function ClientWorkersDisplay({ 
  clientId, 
  selectedWorker, 
  setSelectedWorker, 
  isAuthenticated,
  user 
}: ClientWorkersDisplayProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showAddWorkerDialog, setShowAddWorkerDialog] = useState(false);
  const [showEditWorkerDialog, setShowEditWorkerDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  
  // Fetch workers for this client
  const { data: workers = [], isLoading: workersLoading, refetch: refetchWorkers } = useQuery({
    queryKey: ['/api/clients', clientId, 'workers'],
    enabled: isAuthenticated && !!clientId,
  });

  // Create worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: async (workerData: any) => {
      return apiRequest('POST', `/api/clients/${clientId}/workers`, workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      toast({
        title: "Success",
        description: "Worker created successfully",
      });
      setShowAddWorkerDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create worker",
        variant: "destructive",
      });
    },
  });

  // Update worker mutation
  const updateWorkerMutation = useMutation({
    mutationFn: async (workerData: any) => {
      return apiRequest('PUT', `/api/clients/${clientId}/workers/${editingWorker?.id}`, workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
      setShowEditWorkerDialog(false);
      setEditingWorker(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update worker",
        variant: "destructive",
      });
    },
  });

  // Delete worker mutation
  const deleteWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return apiRequest('DELETE', `/api/clients/${clientId}/workers/${workerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });
      if (selectedWorker?.id === editingWorker?.id) {
        setSelectedWorker?.(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete worker",
        variant: "destructive",
      });
    },
  });

  // Handle worker creation
  const handleCreateWorker = (data: any) => {
    createWorkerMutation.mutate(data);
  };

  // Handle worker update
  const handleUpdateWorker = (data: any) => {
    updateWorkerMutation.mutate(data);
  };

  // Handle worker deletion
  const handleDeleteWorker = (workerId: string) => {
    deleteWorkerMutation.mutate(workerId);
  };

  // Handle edit worker
  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setShowEditWorkerDialog(true);
  };

  // Filter workers based on search term
  const filteredWorkers = workers.filter((worker: Worker) => {
    if (!workerSearchTerm) return true;
    const searchLower = workerSearchTerm.toLowerCase();
    return (
      worker.firstName.toLowerCase().includes(searchLower) ||
      worker.lastName.toLowerCase().includes(searchLower) ||
      (worker.middleName && worker.middleName.toLowerCase().includes(searchLower)) ||
      (worker.email && worker.email.toLowerCase().includes(searchLower)) ||
      worker.nationality.toLowerCase().includes(searchLower) ||
      worker.passportNumber.toLowerCase().includes(searchLower)
    );
  });

  // Format worker full name
  const getWorkerFullName = (worker: Worker) => {
    const parts = [worker.firstName, worker.middleName, worker.lastName].filter(Boolean);
    return parts.join(' ');
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Check if user can manage workers (ADMIN or OWNER roles)
  const canManageWorkers = user?.role === 'ADMIN' || user?.role === 'OWNER';

  if (workersLoading) {
    return (
      <div className="mt-6 p-4 border-t">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border-t bg-gray-50 rounded-b-lg">
      <div className="space-y-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Workers ({filteredWorkers.length})
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workers..."
                value={workerSearchTerm}
                onChange={(e) => setWorkerSearchTerm(e.target.value)}
                className="pl-8 w-64"
                data-testid="input-search-client-workers"
              />
            </div>
            {canManageWorkers && (
              <Dialog open={showAddWorkerDialog} onOpenChange={setShowAddWorkerDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-worker">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Worker</DialogTitle>
                    <DialogDescription>
                      Create a comprehensive worker profile with all immigration details.
                    </DialogDescription>
                  </DialogHeader>
                  <WorkerForm
                    onSubmit={handleCreateWorker}
                    isLoading={createWorkerMutation.isPending}
                    clientProfileId={clientId}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Workers List */}
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {workerSearchTerm ? 'No workers found' : 'No workers yet'}
                </h4>
                <p className="text-gray-500 mb-4">
                  {workerSearchTerm
                    ? 'Try adjusting your search criteria.'
                    : 'Start by adding your first worker to this client.'}
                </p>
                {!workerSearchTerm && canManageWorkers && (
                  <Button onClick={() => setShowAddWorkerDialog(true)} data-testid="button-add-first-worker">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Worker
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWorkers.map((worker: Worker) => (
              <Card key={worker.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {getWorkerFullName(worker)}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {worker.nationality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {worker.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="truncate ml-2" title={worker.email}>{worker.email}</span>
                      </div>
                    )}
                    {worker.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span>{worker.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passport:</span>
                      <span>{worker.passportNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">DOB:</span>
                      <span>{formatDate(worker.dob || '')}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorker?.(worker)}
                        data-testid={`button-view-worker-${worker.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canManageWorkers && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWorker(worker)}
                            data-testid={`button-edit-worker-${worker.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-worker-${worker.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Worker</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {getWorkerFullName(worker)}? 
                                  This action cannot be undone and will remove all associated workflow data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteWorker(worker.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  data-testid={`button-confirm-delete-worker-${worker.id}`}
                                >
                                  Delete Worker
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Added {formatDate(worker.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Worker Details */}
        {selectedWorker && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardHeader className="bg-blue-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-900">
                  {getWorkerFullName(selectedWorker)} - Workflow Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorker?.(null)}
                  data-testid="button-close-worker-details"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <WorkerWorkflowDisplay
                workerId={selectedWorker.id}
                workflowData={{}}
                isLoading={false}
                isAuthenticated={isAuthenticated}
                userRole={user?.role}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Worker Dialog */}
      {editingWorker && (
        <Dialog open={showEditWorkerDialog} onOpenChange={setShowEditWorkerDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Worker - {getWorkerFullName(editingWorker)}</DialogTitle>
              <DialogDescription>
                Update worker information and immigration details.
              </DialogDescription>
            </DialogHeader>
            <WorkerForm
              onSubmit={handleUpdateWorker}
              isLoading={updateWorkerMutation.isPending}
              initialData={editingWorker}
              clientProfileId={clientId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}