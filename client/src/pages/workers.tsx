import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Filter, Edit2, Eye, MapPin, Calendar, Briefcase, Save, X } from 'lucide-react';
import { Link } from 'wouter';

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
  clientProfileId: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkersPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  usePageTitle('nav.workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedNationality, setSelectedNationality] = useState('all');
  const [showNewWorkerForm, setShowNewWorkerForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newWorkerForm, setNewWorkerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    currentWorkPermitExpiry: '',
    status: 'PENDING',
    clientProfileId: ''
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

  // Fetch workers from API
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['/api/workers'],
    enabled: isAuthenticated,
  });

  // Fetch clients for the dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Create worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: (workerData: typeof newWorkerForm) => {
      if (!workerData.clientProfileId) {
        throw new Error('Client ID is required to create a worker');
      }
      return apiRequest(`/api/clients/${workerData.clientProfileId}/workers`, 'POST', workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setShowNewWorkerForm(false);
      setNewWorkerForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        passportNumber: '',
        currentWorkPermitExpiry: '',
        status: 'PENDING',
        clientProfileId: ''
      });
      toast({
        title: "Success",
        description: "Worker created successfully",
      });
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
    mutationFn: ({ id, clientProfileId, ...workerData }: Worker) => {
      if (!clientProfileId) {
        throw new Error('Client ID is required to update a worker');
      }
      return apiRequest(`/api/clients/${clientProfileId}/workers/${id}`, 'PUT', workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setEditingWorker(null);
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update worker",
        variant: "destructive",
      });
    },
  });

  // Filter workers based on search criteria
  const filteredWorkers = (workers as Worker[]).filter((worker: Worker) => {
    const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || worker.status === selectedStatus;
    const matchesNationality = selectedNationality === 'all' || worker.nationality === selectedNationality;
    
    return matchesSearch && matchesStatus && matchesNationality;
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
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              {t('pages.workers.title') || 'Workers'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.workers.description') || 'Manage foreign workers and their immigration status'}
            </p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
            <Button
              onClick={() => setShowNewWorkerForm(true)}
              disabled={showNewWorkerForm}
              className="flex items-center gap-2"
              data-testid="button-add-worker"
            >
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
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
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-workers"
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nationality</label>
                <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                  <SelectTrigger>
                    <SelectValue placeholder="All nationalities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Nationalities</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Nepal">Nepal</SelectItem>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Worker Form */}
        {showNewWorkerForm && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Add New Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                createWorkerMutation.mutate(newWorkerForm);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newWorkerForm.firstName}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      data-testid="input-worker-firstName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newWorkerForm.lastName}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      data-testid="input-worker-lastName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newWorkerForm.email}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-worker-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newWorkerForm.phone}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-worker-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={newWorkerForm.nationality} onValueChange={(value) => setNewWorkerForm(prev => ({ ...prev, nationality: value }))}>
                      <SelectTrigger data-testid="select-worker-nationality">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Philippines">Philippines</SelectItem>
                        <SelectItem value="Nepal">Nepal</SelectItem>
                        <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                        <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="Ukrainian">Ukrainian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      value={newWorkerForm.passportNumber}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                      data-testid="input-worker-passportNumber"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentWorkPermitExpiry">Work Permit Expiry</Label>
                    <Input
                      id="currentWorkPermitExpiry"
                      type="date"
                      value={newWorkerForm.currentWorkPermitExpiry}
                      onChange={(e) => setNewWorkerForm(prev => ({ ...prev, currentWorkPermitExpiry: e.target.value }))}
                      data-testid="input-worker-currentWorkPermitExpiry"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newWorkerForm.status} onValueChange={(value) => setNewWorkerForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger data-testid="select-worker-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <div>
                      <Label htmlFor="clientProfileId">Client *</Label>
                      <Select value={newWorkerForm.clientProfileId} onValueChange={(value) => setNewWorkerForm(prev => ({ ...prev, clientProfileId: value }))}>
                        <SelectTrigger data-testid="select-worker-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {(clients as any[]).map((client: any) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.legalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createWorkerMutation.isPending}
                    data-testid="button-save-worker"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createWorkerMutation.isPending ? 'Saving...' : 'Save Worker'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewWorkerForm(false)}
                    data-testid="button-cancel-worker"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Worker Dialog */}
        {editingWorker && (
          <Dialog open={!!editingWorker} onOpenChange={() => setEditingWorker(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Edit Worker</DialogTitle>
                <DialogDescription>
                  Update worker information for {editingWorker.firstName} {editingWorker.lastName}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateWorkerMutation.mutate(editingWorker);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-firstName">First Name *</Label>
                    <Input
                      id="edit-firstName"
                      value={editingWorker.firstName}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                      required
                      data-testid="input-edit-worker-firstName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName">Last Name *</Label>
                    <Input
                      id="edit-lastName"
                      value={editingWorker.lastName}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                      required
                      data-testid="input-edit-worker-lastName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingWorker.email}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, email: e.target.value } : null)}
                      required
                      data-testid="input-edit-worker-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editingWorker.phone || ''}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      data-testid="input-edit-worker-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nationality">Nationality</Label>
                    <Select value={editingWorker.nationality || ''} onValueChange={(value) => setEditingWorker(prev => prev ? { ...prev, nationality: value } : null)}>
                      <SelectTrigger data-testid="select-edit-worker-nationality">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Philippines">Philippines</SelectItem>
                        <SelectItem value="Nepal">Nepal</SelectItem>
                        <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                        <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="Ukrainian">Ukrainian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-passportNumber">Passport Number</Label>
                    <Input
                      id="edit-passportNumber"
                      value={editingWorker.passportNumber || ''}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, passportNumber: e.target.value } : null)}
                      data-testid="input-edit-worker-passportNumber"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-currentWorkPermitExpiry">Work Permit Expiry</Label>
                    <Input
                      id="edit-currentWorkPermitExpiry"
                      type="date"
                      value={editingWorker.currentWorkPermitExpiry ? editingWorker.currentWorkPermitExpiry.split('T')[0] : ''}
                      onChange={(e) => setEditingWorker(prev => prev ? { ...prev, currentWorkPermitExpiry: e.target.value } : null)}
                      data-testid="input-edit-worker-currentWorkPermitExpiry"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editingWorker.status} onValueChange={(value) => setEditingWorker(prev => prev ? { ...prev, status: value } : null)}>
                      <SelectTrigger data-testid="select-edit-worker-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <div>
                      <Label htmlFor="edit-clientProfileId">Client *</Label>
                      <Select value={editingWorker.clientProfileId} onValueChange={(value) => setEditingWorker(prev => prev ? { ...prev, clientProfileId: value } : null)}>
                        <SelectTrigger data-testid="select-edit-worker-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {(clients as any[]).map((client: any) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.legalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingWorker(null)} data-testid="button-cancel-edit-worker">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateWorkerMutation.isPending} data-testid="button-save-edit-worker">
                    {updateWorkerMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Workers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers ({filteredWorkers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading workers...</p>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workers found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedStatus !== 'all' || selectedNationality !== 'all' 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No workers have been registered yet. Add workers to start managing their immigration process.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkers.map((worker: Worker) => (
                  <Card 
                    key={worker.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    data-testid={`worker-card-${worker.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${worker.email}`} />
                          <AvatarFallback>{getInitials(worker.firstName, worker.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {worker.firstName} {worker.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{worker.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
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
                            <Briefcase className="h-3 w-3" />
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

                      <div className="flex items-center gap-2">
                        <Link href={`/workers/${worker.id}`}>
                          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-worker-${worker.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingWorker(worker)}
                            data-testid={`button-edit-worker-${worker.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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