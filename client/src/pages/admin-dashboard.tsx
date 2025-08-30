import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import WorkflowKanban from "@/components/kanban/workflow-kanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/LanguageContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { NavigationBreadcrumb } from "@/components/layout/NavigationBreadcrumb";

// Component to display all workers from all clients
function AllWorkersDisplay({ selectedWorker, setSelectedWorker }: { selectedWorker: any, setSelectedWorker: (worker: any) => void }) {
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    email: '',
    phone: '',
    passportNumber: '',
    dob: '',
    passportExpiry: ''
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all workers
  const { data: allWorkers, isLoading } = useQuery({
    queryKey: ['/api/workers'],
    queryFn: async () => {
      const response = await fetch('/api/workers');
      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }
      return response.json();
    }
  });

  // Update worker mutation
  const updateWorkerMutation = useMutation({
    mutationFn: async (data: { workerId: string, workerData: any }) => {
      const response = await apiRequest("PUT", `/api/workers/${data.workerId}`, data.workerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setEditingWorker(null);
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update worker",
        variant: "destructive",
      });
    }
  });

  const startEditing = (worker: any) => {
    setEditingWorker(worker.id);
    setEditForm({
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      nationality: worker.nationality || '',
      email: worker.email || '',
      phone: worker.phone || '',
      passportNumber: worker.passportNumber || '',
      dob: worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : '',
      passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().split('T')[0] : ''
    });
  };

  const saveWorker = async (workerId: string) => {
    await updateWorkerMutation.mutateAsync({ workerId, workerData: editForm });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const workers = allWorkers || [];

  // Filter workers by search term and status
  const filteredWorkers = workers.filter((worker: any) => {
    const matchesSearch = !searchTerm || 
      `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">All Workers</h3>
          <p className="text-gray-600">Manage workers across all clients</p>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workers List */}
      {filteredWorkers.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-user-plus text-gray-400 text-3xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers Found</h3>
          <p className="text-gray-600">No workers match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkers.map((worker: any) => (
            <div key={worker.id} className="border rounded-lg">
              <div 
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedWorker?.id === worker.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-blue-600"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {worker.firstName} {worker.lastName}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          <i className="fas fa-building mr-1"></i>
                          {worker.clientName || 'Unassigned'}
                        </span>
                        <span>
                          <i className="fas fa-flag mr-1"></i>
                          {worker.nationality || 'N/A'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {worker.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className={`fas ${selectedWorker?.id === worker.id ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`}></i>
                  </div>
                </div>
              </div>

              {/* Worker Details */}
              {selectedWorker?.id === worker.id && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-gray-900">Worker Details</h5>
                    <div className="flex space-x-2">
                      {editingWorker === worker.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveWorker(worker.id)}
                            disabled={updateWorkerMutation.isPending}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <i className="fas fa-save mr-2"></i>
                            {updateWorkerMutation.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingWorker(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <i className="fas fa-ban mr-2"></i>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(worker)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Edit Worker
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal Info */}
                    <div className="space-y-3">
                      <h6 className="font-medium text-gray-900 text-sm">Personal Information</h6>
                      <div className="space-y-2 text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">First Name:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.firstName || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Last Name:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.lastName || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Nationality:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              value={editForm.nationality}
                              onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.nationality || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Date of Birth:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              type="date"
                              value={editForm.dob}
                              onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">
                              {worker.dob ? new Date(worker.dob).toLocaleDateString() : 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact & Documents */}
                    <div className="space-y-3">
                      <h6 className="font-medium text-gray-900 text-sm">Contact & Documents</h6>
                      <div className="space-y-2 text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Email:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.email || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Phone:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              value={editForm.phone}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.phone || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Passport Number:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              value={editForm.passportNumber}
                              onChange={(e) => setEditForm({...editForm, passportNumber: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">{worker.passportNumber || 'N/A'}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Passport Expires:</span>
                          {editingWorker === worker.id ? (
                            <Input
                              type="date"
                              value={editForm.passportExpiry}
                              onChange={(e) => setEditForm({...editForm, passportExpiry: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-medium block">
                              {worker.passportExpiry ? new Date(worker.passportExpiry).toLocaleDateString() : 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Client & Status Info */}
                    <div className="space-y-3">
                      <h6 className="font-medium text-gray-900 text-sm">Client & Status</h6>
                      <div className="space-y-2 text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Client Company:</span>
                          <span className="font-medium block">{worker.clientName || 'Unassigned'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Status:</span>
                          <span className={`font-medium block ${
                            worker.status === 'active' ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {worker.status || 'Active'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-600 text-xs">Created:</span>
                          <span className="font-medium block">
                            {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component to display client-specific workers  
function ClientWorkersDisplay({ clientId, selectedWorker, setSelectedWorker }: { clientId: string, selectedWorker: any, setSelectedWorker: (worker: any) => void }) {
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    email: '',
    phone: '',
    passportNumber: '',
    dob: '',
    passportExpiry: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation for updating worker
  const updateWorkerMutation = useMutation({
    mutationFn: async (data: { workerId: string, workerData: any }) => {
      const response = await apiRequest("PUT", `/api/workers/${data.workerId}`, data.workerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'workers'] });
      setEditingWorker(null);
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update worker",
        variant: "destructive",
      });
    }
  });

  const startEditing = (worker: any) => {
    setEditingWorker(worker.id);
    setEditForm({
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      nationality: worker.nationality || '',
      email: worker.email || '',
      phone: worker.phone || '',
      passportNumber: worker.passportNumber || '',
      dob: worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : '',
      passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().split('T')[0] : ''
    });
  };

  const saveWorker = async (workerId: string) => {
    await updateWorkerMutation.mutateAsync({ workerId, workerData: editForm });
  };

  const { data: workers, isLoading } = useQuery({
    queryKey: ['/api/clients', clientId, 'workers'],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/workers`);
      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }
      return response.json();
    }
  });

  // Fetch detailed worker info with assignments when a worker is selected
  const { data: workerDetailsData, isLoading: workerDetailsLoading } = useQuery({
    queryKey: ['/api/workers', selectedWorker?.id],
    queryFn: async () => {
      if (!selectedWorker?.id) return null;
      const response = await fetch(`/api/workers/${selectedWorker.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch worker details');
      }
      return response.json();
    },
    enabled: !!selectedWorker?.id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
        <p>No workers found for this client.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workers.map((worker: any, index: number) => (
        <div key={worker.id || index}>
          {/* Worker Row */}
          <div
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedWorker?.id === worker.id 
                ? 'bg-green-50 border-green-200' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-green-600"></i>
              </div>
              <div>
                <p className="font-medium">{worker.firstName} {worker.lastName}</p>
                <p className="text-sm text-gray-600">{worker.nationality} • {worker.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{worker.status || 'Active'}</p>
                <p className="text-xs text-gray-500">ID: {worker.passportNumber || 'N/A'}</p>
              </div>
              <i className={`fas fa-chevron-${selectedWorker?.id === worker.id ? 'up' : 'down'} text-gray-400`}></i>
            </div>
          </div>
          
          {/* Worker Details - Appears right below the selected worker */}
          {selectedWorker?.id === worker.id && (
            <div className="mt-3 ml-14 bg-white border border-green-100 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-gray-900">Worker Details</h5>
                <div className="flex space-x-2">
                  {editingWorker === worker.id ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveWorker(worker.id);
                        }}
                        disabled={updateWorkerMutation.isPending}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <i className="fas fa-save mr-2"></i>
                        {updateWorkerMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorker(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-ban mr-2"></i>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(worker);
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit Worker
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWorker(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h6 className="font-medium text-gray-900 text-sm">Personal Information</h6>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">First Name:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="First Name"
                        />
                      ) : (
                        <span className="font-medium block">{worker.firstName || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Last Name:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Last Name"
                        />
                      ) : (
                        <span className="font-medium block">{worker.lastName || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Nationality:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          value={editForm.nationality}
                          onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Nationality"
                        />
                      ) : (
                        <span className="font-medium block">{worker.nationality || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Date of Birth:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium block">
                          {worker.dob ? new Date(worker.dob).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h6 className="font-medium text-gray-900 text-sm">Contact & Document Info</h6>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Email:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Email"
                        />
                      ) : (
                        <span className="font-medium block">{worker.email || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Phone:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Phone Number"
                        />
                      ) : (
                        <span className="font-medium block">{worker.phone || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Passport Number:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          value={editForm.passportNumber}
                          onChange={(e) => setEditForm({...editForm, passportNumber: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Passport Number"
                        />
                      ) : (
                        <span className="font-medium block">{worker.passportNumber || 'N/A'}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600 text-xs">Passport Expires:</span>
                      {editingWorker === worker.id ? (
                        <Input
                          type="date"
                          value={editForm.passportExpiry}
                          onChange={(e) => setEditForm({...editForm, passportExpiry: e.target.value})}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium block">
                          {worker.passportExpiry ? new Date(worker.passportExpiry).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Immigration Workflow Section */}
              {!editingWorker && workerDetailsData && workerDetailsData.assignments && workerDetailsData.assignments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h6 className="font-medium text-gray-900 text-sm mb-4">Immigration Workflow Status</h6>
                  <div className="space-y-3">
                    {(() => {
                      // Group assignments by stage for better organization
                      const stageGroups = workerDetailsData.assignments.reduce((acc: any, assignment: any) => {
                        const stage = assignment.requirement?.stage?.key || 'Unknown';
                        if (!acc[stage]) {
                          acc[stage] = [];
                        }
                        acc[stage].push(assignment);
                        return acc;
                      }, {});

                      // Define stage order
                      const stageOrder = ['AJOFM', 'IGI_WORK_PERMIT', 'CONSULATE_VISA', 'IGI_RESIDENCE'];
                      
                      return stageOrder.map((stage) => {
                        const assignments = stageGroups[stage] || [];
                        if (assignments.length === 0) return null;

                        return (
                          <div key={stage} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-800 text-sm">
                                {stage === 'AJOFM' ? 'AJOFM Labor Market Test' :
                                 stage === 'IGI_WORK_PERMIT' ? 'IGI Work Permit' :
                                 stage === 'CONSULATE_VISA' ? 'Consulate Visa Application' :
                                 stage === 'IGI_RESIDENCE' ? 'IGI Residence Permit' : stage}
                              </h6>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                assignments.some((a: any) => a.status === 'APPROVED_BY_ADMIN') ? 'bg-green-100 text-green-800' :
                                assignments.some((a: any) => a.status === 'SUBMITTED_BY_USER' || a.status === 'RECEIVED_BY_ADMIN') ? 'bg-blue-100 text-blue-800' :
                                assignments.some((a: any) => a.status === 'AWAITING_UPLOAD') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {assignments.some((a: any) => a.status === 'APPROVED_BY_ADMIN') ? 'Completed' :
                                 assignments.some((a: any) => a.status === 'SUBMITTED_BY_USER' || a.status === 'RECEIVED_BY_ADMIN') ? 'In Progress' :
                                 assignments.some((a: any) => a.status === 'AWAITING_UPLOAD') ? 'Pending' : 'Not Started'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {assignments.map((assignment: any, index: number) => (
                                <div key={assignment.id || index} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">
                                    {assignment.requirement?.title || `Requirement ${index + 1}`}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      assignment.status === 'APPROVED_BY_ADMIN' ? 'bg-green-100 text-green-700' :
                                      assignment.status === 'SUBMITTED_BY_USER' || assignment.status === 'RECEIVED_BY_ADMIN' ? 'bg-blue-100 text-blue-700' :
                                      assignment.status === 'AWAITING_UPLOAD' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {assignment.status === 'APPROVED_BY_ADMIN' ? 'Approved' :
                                       assignment.status === 'SUBMITTED_BY_USER' ? 'Submitted' :
                                       assignment.status === 'RECEIVED_BY_ADMIN' ? 'Under Review' :
                                       assignment.status === 'AWAITING_UPLOAD' ? 'Pending Upload' :
                                       assignment.status === 'NOT_STARTED' ? 'Not Started' : assignment.status}
                                    </span>
                                    {assignment.documentFiles && assignment.documentFiles.length > 0 && (
                                      <span className="text-xs text-gray-500">
                                        📄 {assignment.documentFiles.length} doc{assignment.documentFiles.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                </div>
              )}
              
              {/* Loading state for workflow data */}
              {!editingWorker && selectedWorker && workerDetailsLoading && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading workflow status...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { addBreadcrumb, setBreadcrumbs } = useBreadcrumb();
  
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
    caen: '',
    legalAddress: '',
    adminName: '',
    phoneNumber: '',
    contactEmail: '',
    bankIban: ''
  });

  // Set active section based on current route
  useEffect(() => {
    const routeToSection: Record<string, string> = {
      '/clients': 'clients',
      '/workers': 'workers', 
      '/reports': 'reports',
      '/requirements': 'requirements',
      '/reminders': 'reminders',
      '/audit': 'audit'
    };
    
    const currentSection = routeToSection[location] || 'overview';
    if (currentSection !== activeSection) {
      setActiveSection(currentSection);
      // Reset selected client when changing sections to prevent flash
      if (currentSection === 'clients' && selectedClient) {
        setSelectedClient(null);
      }
    }
  }, [location]);

  // Breadcrumb management
  useEffect(() => {
    const breadcrumbMap: Record<string, { label: string; href: string }> = {
      overview: { label: 'Dashboard', href: '/dashboard' },
      clients: { label: 'Clients', href: '/clients' },
      workers: { label: 'Workers', href: '/workers' },
      documents: { label: 'Templates', href: '/templates' },
      reports: { label: 'Reports', href: '/reports' },
      requirements: { label: 'Requirements', href: '/requirements' },
      reminders: { label: 'Reminders', href: '/reminders' },
      audit: { label: 'Audit Logs', href: '/audit' }
    };

    if (activeSection === 'overview') {
      setBreadcrumbs([]);
    } else if (activeSection === 'clients' && !selectedClient) {
      // Don't show breadcrumbs for main clients list
      setBreadcrumbs([]);
    } else if (selectedClient && (activeSection === 'clients' || activeSection === 'workers')) {
      const baseBreadcrumb = breadcrumbMap[activeSection];
      setBreadcrumbs([
        baseBreadcrumb,
        { label: selectedClient.legalName, href: `${baseBreadcrumb.href}/${selectedClient.id}` }
      ]);
    } else if (breadcrumbMap[activeSection]) {
      setBreadcrumbs([breadcrumbMap[activeSection]]);
    }
  }, [activeSection, selectedClient, setBreadcrumbs]);
  
  
  // Form state
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

  const [editWorkerForm, setEditWorkerForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    email: '',
    phone: '',
    passportNumber: '',
    dob: '',
    passportExpiry: ''
  });
  
  const [addingWorker, setAddingWorker] = useState(false);
  const [addWorkerForm, setAddWorkerForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    email: '',
    phone: '',
    passportNumber: '',
    dob: '',
    passportExpiry: ''
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: auditLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/audit"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard/assignments"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch workers for selected client
  const { data: directWorkers = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", selectedClient?.id, "workers"],
    enabled: isAuthenticated && !isLoading && !!selectedClient?.id,
  });

  const { data: recentActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard/activities"],
    enabled: isAuthenticated && !isLoading && user?.role === 'ADMIN',
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);



  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: { clientId: string, clientData: any }) => {
      const response = await apiRequest("PUT", `/api/clients/${data.clientId}`, data.clientData);
      return response.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditingClient(false);
      setSelectedClient(updatedClient);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate(newClientForm);
  };

  const handleFormChange = (field: string, value: string) => {
    setNewClientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startEditingClient = (client: any) => {
    setEditingClient(true);
    setEditClientForm({
      legalName: client.legalName || '',
      registrationNumber: client.registrationNumber || '',
      cui: client.cui || '',
      caen: client.caen || '',
      legalAddress: client.legalAddress || '',
      adminName: client.adminName || '',
      phoneNumber: client.phoneNumber || '',
      contactEmail: client.contactEmail || '',
      bankIban: client.bankIban || ''
    });
  };

  const saveClient = async () => {
    if (selectedClient) {
      await updateClientMutation.mutateAsync({ 
        clientId: selectedClient.id, 
        clientData: editClientForm 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const stats = dashboardStats || {
    totalClients: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    pendingActions: 0,
    completedThisMonth: 0,
    assignmentsByStatus: {},
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole="ADMIN" onSectionChange={setActiveSection} currentSection={activeSection} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={
            showNewClientForm 
              ? "New Client"
              : selectedClient 
                ? "Admin Dashboard"
                : activeSection === "clients"
                  ? "Clients"
                  : activeSection === "workers" 
                    ? "Workers & Workflow"
                    : activeSection === "documents"
                      ? "Documents" 
                      : activeSection === "reports"
                        ? "Reports"
                        : activeSection === "requirements"
                          ? "Requirements"
                          : activeSection === "reminders"
                            ? "Reminders"
                            : activeSection === "audit"
                              ? "Audit Logs"
                              : "Admin Dashboard"
          }
          subtitle={
            showNewClientForm
              ? (t('common.fillClientDetails') || "Fill in the client information below")
              : selectedClient
                ? selectedClient.legalName + " - " + (t('dashboard.clientProfile') || "Client Profile & Management")
                : (t('dashboard.admin.subtitle') || "Global workflow management and oversight")
          }
          actions={
            showNewClientForm ? null : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Input 
                  placeholder={t('common.searchPlaceholder') || 'Search clients, workers, CUI...'} 
                  className="w-full sm:w-80"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  data-testid="input-global-search"
                />
                {!selectedClient && (
                  <Button 
                    data-testid="button-new-client" 
                    className="shrink-0"
                    onClick={() => setShowNewClientForm(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>{t('actions.newClient') || 'New Client'}
                  </Button>
                )}
              </div>
            )
          }
        />

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 max-w-full overflow-x-hidden" style={{ paddingTop: 'calc(1rem + var(--header-offset, 0px))' }}>
            <NavigationBreadcrumb />
            {activeSection === "overview" && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card data-testid="card-total-clients">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.totalClients') || 'Total Clients'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-arrow-up mr-1"></i>{t('dashboard.stats.newClients') || 'New clients'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-building text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-active-workers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.activeWorkers') || 'Active Workers'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeWorkers}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-arrow-up mr-1"></i>{t('dashboard.stats.activeCases') || 'Active cases'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-actions">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.pendingActions') || 'Pending Actions'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingActions}</p>
                    <p className="text-sm text-warning">
                      <i className="fas fa-clock mr-1"></i>{t('dashboard.stats.needsAttention') || 'Needs attention'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-warning text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-completed-month">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.completedThisMonth') || 'Completed This Month'}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedThisMonth}</p>
                    <p className="text-sm text-success">
                      <i className="fas fa-check mr-1"></i>{t('dashboard.stats.thisMonth') || 'This month'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-success text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Clients Section */}
          <Collapsible open={clientsOpen} onOpenChange={setClientsOpen} className="mb-6">
            <Card data-testid="card-clients-overview">
              <CardHeader className="border-b border-gray-200">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center">
                      <i className="fas fa-building mr-2"></i>
                      {t('common.clients') || 'Clients Overview'}
                    </CardTitle>
                    {clientsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('common.filters') || 'Filters'}:</span>
                    </div>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-client-filter">
                        <SelectValue placeholder={t('common.allClients') || 'All Clients'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allClients') || 'All Clients'}</SelectItem>
                        <SelectItem value="active">{t('common.activeClients') || 'Active Clients'}</SelectItem>
                        <SelectItem value="inactive">{t('common.inactiveClients') || 'Inactive Clients'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                        <SelectValue placeholder={t('common.allStatuses') || 'All Statuses'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allStatuses') || 'All Statuses'}</SelectItem>
                        <SelectItem value="pending">{t('common.pending') || 'Pending'}</SelectItem>
                        <SelectItem value="approved">{t('common.approved') || 'Approved'}</SelectItem>
                        <SelectItem value="processing">{t('common.processing') || 'Processing'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Navigation Breadcrumb */}
                  {selectedClient && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedClient(null);
                            setEditingClient(false);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <i className="fas fa-arrow-left mr-2"></i>
                          {t('common.clients') || 'Clients'}
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">{selectedClient.companyName}</span>
                      </div>
                      <Button
                        variant={editingClient ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingClient(!editingClient)}
                        data-testid="button-edit-client"
                      >
                        <i className={`fas ${editingClient ? 'fa-save' : 'fa-edit'} mr-2`}></i>
                        {editingClient ? (t('actions.save') || 'Save') : (t('actions.edit') || 'Edit')}
                      </Button>
                    </div>
                  )}

                  {/* Client List View */}
                  {!selectedClient && !showNewClientForm && (
                    <div className="space-y-4">
                      {/* New Client Button */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{t('common.clientList') || 'Client List'}</h4>
                        <Button
                          onClick={() => setShowNewClientForm(true)}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="button-new-client"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          {t('actions.newClient') || 'New Client'}
                        </Button>
                      </div>
                      
                      {(() => {
                        const filteredClients = clients.filter((client: any) => {
                          const matchesSearch = !clientSearchTerm || 
                            client.legalName?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.cui?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.contactEmail?.toLowerCase().includes(clientSearchTerm.toLowerCase());
                          
                          const matchesStatus = statusFilter === "all" || 
                            (client.status || "active").toLowerCase() === statusFilter.toLowerCase();
                          
                          const matchesClientFilter = clientFilter === "all" || 
                            (clientFilter === "active" && (client.status || "active") === "active") ||
                            (clientFilter === "inactive" && client.status === "inactive");
                          
                          return matchesSearch && matchesStatus && matchesClientFilter;
                        });

                        if (filteredClients.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <i className="fas fa-building text-gray-400 text-3xl mb-4"></i>
                              <p className="text-secondary">
                                {clientSearchTerm || clientFilter !== "all" || statusFilter !== "all" 
                                  ? "No clients match your filters"
                                  : "No clients found"
                                }
                              </p>
                            </div>
                          );
                        }

                        return filteredClients.map((client: any, index: number) => (
                          <div 
                            key={client.id || index} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedWorker(null); // Reset worker selection when selecting new client
                            }}
                            data-testid={`client-${index}`}
                          >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-building text-primary"></i>
                            </div>
                            <div>
                              <p className="font-medium">{client.legalName}</p>
                              <p className="text-sm text-secondary">CUI: {client.cui}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{client.activeWorkers || 0} workers</p>
                            <p className="text-xs text-secondary">{client.status}</p>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                          </div>
                        </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* New Client Form */}
                  {showNewClientForm && (
                    <div className="space-y-6">
                      {/* Form Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2 text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowNewClientForm(false)}
                            className="text-primary hover:text-primary/80"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            {t('common.clients') || 'Clients'}
                          </Button>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">{t('actions.newClient') || 'New Client'}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <i className="fas fa-building text-white"></i>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{t('actions.addNewClient') || 'Add New Client'}</h3>
                            <p className="text-gray-600">{t('common.fillClientDetails') || 'Fill in the client information below'}</p>
                          </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleCreateClient}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Legal Name *</label>
                              <Input
                                placeholder="e.g., Tech Solutions SRL"
                                className="bg-white"
                                data-testid="input-new-legal-name"
                                value={newClientForm.legalName}
                                onChange={(e) => handleFormChange('legalName', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Registration Number (ONRC) *</label>
                              <Input
                                placeholder="e.g., J40/12345/2020"
                                className="bg-white"
                                data-testid="input-new-registration-number"
                                value={newClientForm.registrationNumber}
                                onChange={(e) => handleFormChange('registrationNumber', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">CUI (Fiscal Code) *</label>
                              <Input
                                placeholder="e.g., RO12345678"
                                className="bg-white"
                                data-testid="input-new-cui"
                                value={newClientForm.cui}
                                onChange={(e) => handleFormChange('cui', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">CAEN Code *</label>
                              <Input
                                placeholder="e.g., 6201"
                                className="bg-white"
                                data-testid="input-new-caen"
                                value={newClientForm.caen}
                                onChange={(e) => handleFormChange('caen', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Legal Address (Sediu Legal) *</label>
                            <Input
                              placeholder="e.g., Strada Victoriei Nr. 10, Sector 1, București, România"
                              className="bg-white"
                              data-testid="input-new-legal-address"
                              value={newClientForm.legalAddress}
                              onChange={(e) => handleFormChange('legalAddress', e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Administrator Name *</label>
                            <Input
                              placeholder="e.g., Ion Popescu"
                              className="bg-white"
                              data-testid="input-new-admin-name"
                              value={newClientForm.adminName}
                              onChange={(e) => handleFormChange('adminName', e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Contact Email *</label>
                              <Input
                                type="email"
                                placeholder="contact@company.com"
                                className="bg-white"
                                data-testid="input-new-contact-email"
                                value={newClientForm.contactEmail}
                                onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                              <Input
                                placeholder="e.g., +40 21 123 4567"
                                className="bg-white"
                                data-testid="input-new-phone-number"
                                value={newClientForm.phoneNumber}
                                onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bank IBAN Account *</label>
                            <Input
                              placeholder="e.g., RO49AAAA1B31007593840000"
                              className="bg-white"
                              data-testid="input-new-bank-iban"
                              value={newClientForm.bankIban}
                              onChange={(e) => handleFormChange('bankIban', e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewClientForm(false)}
                              data-testid="button-cancel-new-client"
                            >
                              {t('actions.cancel') || 'Cancel'}
                            </Button>
                            <Button
                              type="submit"
                              className="bg-primary hover:bg-primary/90"
                              data-testid="button-save-new-client"
                              disabled={createClientMutation.isPending}
                            >
                              {createClientMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  {t('actions.saving') || 'Saving...'}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save mr-2"></i>
                                  {t('actions.saveClient') || 'Save Client'}
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Client Profile View */}
                  {selectedClient && (
                    <div className="space-y-6">
                      {/* Client Profile Header */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-building text-white text-xl"></i>
                            </div>
                            <div className="flex-1">
                              {editingClient ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Legal Name *</label>
                                      <Input
                                        defaultValue={selectedClient.legalName}
                                        className="bg-white"
                                        placeholder="e.g., Tech Solutions SRL"
                                        data-testid="input-edit-legal-name"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Registration Number *</label>
                                      <Input
                                        defaultValue={selectedClient.registrationNumber}
                                        className="bg-white"
                                        placeholder="e.g., J40/12345/2020"
                                        data-testid="input-edit-registration-number"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">CUI *</label>
                                      <Input
                                        defaultValue={selectedClient.cui}
                                        className="bg-white"
                                        placeholder="e.g., RO12345678"
                                        data-testid="input-edit-cui"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">CAEN Code *</label>
                                      <Input
                                        defaultValue={selectedClient.caen}
                                        className="bg-white"
                                        placeholder="e.g., 6201"
                                        data-testid="input-edit-caen"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Legal Address *</label>
                                    <Input
                                      defaultValue={selectedClient.legalAddress}
                                      className="bg-white"
                                      placeholder="e.g., Strada Victoriei Nr. 10, Sector 1, București"
                                      data-testid="input-edit-legal-address"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Administrator Name *</label>
                                    <Input
                                      defaultValue={selectedClient.adminName}
                                      className="bg-white"
                                      placeholder="e.g., Ion Popescu"
                                      data-testid="input-edit-admin-name"
                                      required
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Contact Email *</label>
                                      <Input
                                        type="email"
                                        defaultValue={selectedClient.contactEmail}
                                        className="bg-white"
                                        placeholder="contact@company.com"
                                        data-testid="input-edit-contact-email"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                                      <Input
                                        defaultValue={selectedClient.phoneNumber}
                                        className="bg-white"
                                        placeholder="e.g., +40 21 123 4567"
                                        data-testid="input-edit-phone-number"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Bank IBAN *</label>
                                    <Input
                                      defaultValue={selectedClient.bankIban}
                                      className="bg-white"
                                      placeholder="e.g., RO49AAAA1B31007593840000"
                                      data-testid="input-edit-bank-iban"
                                      required
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.legalName}</h3>
                                  <p className="text-gray-600">CUI: {selectedClient.cui}</p>
                                  <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-600">
                                      <i className="fas fa-map-marker-alt mr-1"></i>
                                      {selectedClient.legalAddress || 'Address not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-phone mr-1"></i>
                                      {selectedClient.phoneNumber || 'Phone not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-envelope mr-1"></i>
                                      {selectedClient.contactEmail || 'Email not provided'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="bg-white rounded-lg px-3 py-2 text-center">
                              <p className="text-2xl font-bold text-primary">{selectedClient.activeWorkers || 0}</p>
                              <p className="text-xs text-gray-600">{t('common.activeWorkers') || 'Active Workers'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions for Workers */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold flex items-center mb-3">
                          <i className="fas fa-users mr-2"></i>
                          Workers Management
                        </h4>
                        <p className="text-gray-600 text-sm mb-4">
                          Manage workers for {selectedClient.legalName}. Use the Workers & Workflow section for detailed worker management.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            onClick={() => setActiveSection("workers")}
                            className="flex-1 min-w-0"
                            data-testid="button-view-workers"
                          >
                            <i className="fas fa-users mr-2"></i>
                            View Workers ({selectedClient.activeWorkers || 0})
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              // Reset form
                              setAddWorkerForm({
                                firstName: '',
                                lastName: '',
                                nationality: '',
                                email: '',
                                phone: '',
                                passportNumber: '',
                                dob: '',
                                passportExpiry: ''
                              });
                              setAddingWorker(true);
                            }}
                            data-testid="button-add-worker"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Add Worker
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Collapsible Recent Activity Section */}
          <Collapsible open={activityOpen} onOpenChange={setActivityOpen} className="mb-6">
            <Card data-testid="card-recent-activity">
              <CardHeader className="border-b border-gray-200">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center">
                      <i className="fas fa-history mr-2"></i>
                      {t('common.recentActivity') || 'Recent Activity'}
                    </CardTitle>
                    {activityOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{t('common.filters') || 'Filters'}:</span>
                    </div>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-activity-client-filter">
                        <SelectValue placeholder={t('common.allClients') || 'All Clients'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allClients') || 'All Clients'}</SelectItem>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-activity-type-filter">
                        <SelectValue placeholder={t('common.allActivities') || 'All Activities'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allActivities') || 'All Activities'}</SelectItem>
                        <SelectItem value="document">Document Uploads</SelectItem>
                        <SelectItem value="status">Status Changes</SelectItem>
                        <SelectItem value="assignment">Worker Assignments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-4">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-clock text-gray-400 text-3xl mb-4"></i>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{t('common.noRecentActivity') || 'No Recent Activity'}</h4>
                        <p className="text-gray-600">{t('common.noRecentActivityDescription') || 'Activity from clients and workers will appear here.'}</p>
                      </div>
                    ) : (
                      recentActivities.slice(0, 10).map((activity: any, index: number) => (
                        <div key={activity.id || index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className={`fas ${
                              activity.type === 'document' ? 'fa-file-alt' :
                              activity.type === 'status' ? 'fa-exchange-alt' :
                              activity.type === 'assignment' ? 'fa-user-plus' :
                              'fa-info'
                            } text-primary`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{activity.clientName || 'Unknown Client'}</span> - {activity.description}
                            </p>
                            <p className="text-xs text-secondary mt-1">
                              {new Date(activity.timestamp || Date.now()).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.type === 'document' ? 'bg-green-100 text-green-800' :
                            activity.type === 'status' ? 'bg-blue-100 text-blue-800' :
                            activity.type === 'assignment' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.type === 'document' ? 'Document' :
                             activity.type === 'status' ? 'Status' :
                             activity.type === 'assignment' ? 'Assignment' :
                             'Other'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
              </>
            )}

          {/* Clients Section */}
          {activeSection === "clients" && (
            <div className="space-y-6">
              <Card data-testid="card-clients">
                <CardContent className="p-6">
                  {/* Selected Client Details */}
                  {selectedClient && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedClient(null);
                            setShowClientWorkers(false);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <i className="fas fa-arrow-left mr-2"></i>
                          Back to Clients
                        </Button>
                        {editingClient ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={saveClient}
                              disabled={updateClientMutation.isPending}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <i className="fas fa-save mr-2"></i>
                              {updateClientMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setEditingClient(false)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <i className="fas fa-ban mr-2"></i>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => startEditingClient(selectedClient)}
                          >
                            <i className="fas fa-edit mr-2"></i>
                            Edit
                          </Button>
                        )}
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                              <i className="fas fa-building text-white text-xl"></i>
                            </div>
                            <div className="flex-1">
                              {editingClient ? (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-600">Legal Name:</label>
                                    <Input
                                      value={editClientForm.legalName}
                                      onChange={(e) => setEditClientForm({...editClientForm, legalName: e.target.value})}
                                      className="h-8 text-sm bg-white"
                                      placeholder="Company Legal Name"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-600">CUI:</label>
                                    <Input
                                      value={editClientForm.cui}
                                      onChange={(e) => setEditClientForm({...editClientForm, cui: e.target.value})}
                                      className="h-8 text-sm bg-white"
                                      placeholder="e.g., RO12345678"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-600">Legal Address:</label>
                                    <Input
                                      value={editClientForm.legalAddress}
                                      onChange={(e) => setEditClientForm({...editClientForm, legalAddress: e.target.value})}
                                      className="h-8 text-sm bg-white"
                                      placeholder="Full legal address"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.legalName}</h3>
                                  <p className="text-gray-600">CUI: {selectedClient.cui}</p>
                                  <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-gray-600">
                                      <i className="fas fa-map-marker-alt mr-1"></i>
                                      {selectedClient.legalAddress || 'Address not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-phone mr-1"></i>
                                      {selectedClient.phoneNumber || 'Phone not provided'}
                                    </span>
                                    <span className="text-gray-600">
                                      <i className="fas fa-envelope mr-1"></i>
                                      {selectedClient.contactEmail || 'Email not provided'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-white rounded-lg px-4 py-2 text-center">
                              <p className="text-2xl font-bold text-primary">{selectedClient.activeWorkers || 0}</p>
                              <p className="text-xs text-gray-600">Active Workers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Client Details Grid */}
                      {!editingClient ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Company Information</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Registration Number:</span>
                                <span className="font-medium">{selectedClient.registrationNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">CAEN Code:</span>
                                <span className="font-medium">{selectedClient.caen || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bank IBAN:</span>
                                <span className="font-medium">{selectedClient.bankIban || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${selectedClient.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                                  {selectedClient.status || 'Active'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Contact Information</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Administrator:</span>
                                <span className="font-medium">{selectedClient.adminName || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-medium">
                                  {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Workers:</span>
                                <span className="font-medium">{selectedClient.activeWorkers || 0} active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Company Information</h4>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">Registration Number:</label>
                                <Input
                                  value={editClientForm.registrationNumber}
                                  onChange={(e) => setEditClientForm({...editClientForm, registrationNumber: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="e.g., J40/12345/2020"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">CAEN Code:</label>
                                <Input
                                  value={editClientForm.caen}
                                  onChange={(e) => setEditClientForm({...editClientForm, caen: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="e.g., 6201"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">Bank IBAN:</label>
                                <Input
                                  value={editClientForm.bankIban}
                                  onChange={(e) => setEditClientForm({...editClientForm, bankIban: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="e.g., RO49AAAA1B31007593840000"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Contact Information</h4>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">Administrator Name:</label>
                                <Input
                                  value={editClientForm.adminName}
                                  onChange={(e) => setEditClientForm({...editClientForm, adminName: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="e.g., Ion Popescu"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">Phone Number:</label>
                                <Input
                                  value={editClientForm.phoneNumber}
                                  onChange={(e) => setEditClientForm({...editClientForm, phoneNumber: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="e.g., +40 123 456 789"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600">Contact Email:</label>
                                <Input
                                  type="email"
                                  value={editClientForm.contactEmail}
                                  onChange={(e) => setEditClientForm({...editClientForm, contactEmail: e.target.value})}
                                  className="h-8 text-sm"
                                  placeholder="contact@company.com"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="border-t pt-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowClientWorkers(!showClientWorkers);
                            }}
                          >
                            <i className="fas fa-users mr-2"></i>
                            {showClientWorkers ? 'Hide' : 'View'} Workers ({selectedClient.activeWorkers || 0})
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setLocation('/templates');
                            }}
                          >
                            <i className="fas fa-file-alt mr-2"></i>
                            Documents
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setActiveSection('reports');
                              setLocation('/reports');
                            }}
                          >
                            <i className="fas fa-chart-line mr-2"></i>
                            Reports
                          </Button>
                        </div>
                      </div>
                      
                      {/* Client Workers Section */}
                      {showClientWorkers && selectedClient && (
                        <div className="border-t pt-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Workers for {selectedClient.legalName}</h4>
                          <ClientWorkersDisplay 
                            clientId={selectedClient.id} 
                            selectedWorker={selectedWorker}
                            setSelectedWorker={setSelectedWorker} 
                          />
                        </div>
                      )}
                      
                    </div>
                  )}

                  {/* Client List View */}
                  {!selectedClient && !showNewClientForm && (
                    <div className="space-y-4">
                      {/* New Client Button */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{t('common.clientList') || 'Client List'}</h4>
                        <Button
                          onClick={() => setShowNewClientForm(true)}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="button-new-client"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          {t('actions.newClient') || 'New Client'}
                        </Button>
                      </div>
                      
                      {(() => {
                        const filteredClients = clients.filter((client: any) => {
                          const matchesSearch = !clientSearchTerm || 
                            client.legalName?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.cui?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                            client.contactEmail?.toLowerCase().includes(clientSearchTerm.toLowerCase());
                          
                          const matchesStatus = statusFilter === "all" || 
                            (client.status || "active").toLowerCase() === statusFilter.toLowerCase();
                          
                          const matchesClientFilter = clientFilter === "all" || 
                            (clientFilter === "active" && (client.status || "active") === "active") ||
                            (clientFilter === "inactive" && client.status === "inactive");
                          
                          return matchesSearch && matchesStatus && matchesClientFilter;
                        });

                        if (filteredClients.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <i className="fas fa-building text-gray-400 text-3xl mb-4"></i>
                              <p className="text-secondary">
                                {clientSearchTerm || clientFilter !== "all" || statusFilter !== "all" 
                                  ? "No clients match your filters"
                                  : "No clients found"
                                }
                              </p>
                            </div>
                          );
                        }

                        return filteredClients.map((client: any, index: number) => (
                          <div 
                            key={client.id || index} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedWorker(null); // Reset worker selection when selecting new client
                            }}
                            data-testid={`client-${index}`}
                          >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-building text-primary"></i>
                            </div>
                            <div>
                              <p className="font-medium">{client.legalName}</p>
                              <p className="text-sm text-secondary">CUI: {client.cui}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{client.activeWorkers || 0} workers</p>
                            <p className="text-xs text-secondary">{client.status || 'active'}</p>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                          </div>
                        </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Templates Section */}
          {activeSection === "documents" && (
            <div className="space-y-6">
              <Card data-testid="card-templates">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <i className="fas fa-file-alt text-gray-400 text-3xl mb-4"></i>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Document Templates</h4>
                    <p className="text-gray-600 mb-4">Manage Romanian immigration document templates</p>
                    <Button 
                      onClick={() => window.location.href = '/templates'}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <i className="fas fa-arrow-right mr-2"></i>
                      Go to Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Requirements Section */}
          {activeSection === "requirements" && (
            <div className="space-y-6">
              <Card data-testid="card-requirements">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <i className="fas fa-clipboard-list text-gray-400 text-3xl mb-4"></i>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Immigration Requirements</h4>
                    <p className="text-gray-600">Manage Romanian immigration requirements and workflows</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reminders Section */}
          {activeSection === "reminders" && (
            <div className="space-y-6">
              <Card data-testid="card-reminders">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <i className="fas fa-bell text-gray-400 text-3xl mb-4"></i>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Automated Reminders</h4>
                    <p className="text-gray-600">Manage email reminders and notifications</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Section */}
          {activeSection === "audit" && (
            <div className="space-y-6">
              <Card data-testid="card-audit">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h4>
                    <p className="text-gray-600">View system activity and security logs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Workers Section - Show all workers from all clients */}
          {activeSection === "workers" && (
            <div className="space-y-6">
              <Card data-testid="card-workers">
                <CardContent className="p-6">
                  <AllWorkersDisplay 
                    selectedWorker={selectedWorker}
                    setSelectedWorker={setSelectedWorker}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Navigation & Quick Action Sections */}
          {isMobile && (
            <>
              <div className="space-y-6">
              {/* Documents Section */}
              {activeSection === "documents" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-file-alt text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
                        <p className="text-secondary">Generate, track, and manage Romanian immigration documents</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Workers Section */}
              {activeSection === "workers" && (
                <div className="space-y-6">
                  <Card data-testid="card-workers-mobile">
                    <CardContent className="p-6">
                      <AllWorkersDisplay 
                        selectedWorker={selectedWorker}
                        setSelectedWorker={setSelectedWorker}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Client Workers Section - Mobile */}
              {activeSection === "clients" && selectedClient && !selectedWorker && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center">
                              <i className="fas fa-users mr-2"></i>
                              Workers for {selectedClient.legalName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Click on a worker to view their immigration workflow
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedClient(null)}
                            data-testid="button-back-to-client-selection"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Client Selection
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Filter assignments by matching clientProfileId to selectedClient.id
                          const clientAssignments = assignments.filter((assignment: any) => 
                            assignment.clientProfileId === selectedClient.id
                          );
                          
                          // Group assignments by workerId to create worker entries with actual worker data
                          const workersMap = new Map();
                          clientAssignments.forEach((assignment: any) => {
                            const workerId = assignment.workerId;
                            const workerData = assignment.worker; // This contains the actual worker info!
                            
                            if (!workersMap.has(workerId)) {
                              workersMap.set(workerId, {
                                id: workerId,
                                assignments: [],
                                status: assignment.status,
                                createdAt: assignment.createdAt,
                                // Use actual worker data if available
                                firstName: workerData?.firstName,
                                lastName: workerData?.lastName,
                                nationality: workerData?.nationality,
                                email: workerData?.email,
                                worker: workerData // Keep full worker object for reference
                              });
                            }
                            workersMap.get(workerId).assignments.push(assignment);
                          });
                          
                          let clientWorkers = Array.from(workersMap.values());

                          // Add any workers from direct API that don't have assignments yet
                          const workerIdsWithAssignments = new Set(clientWorkers.map(w => w.id));
                          const workersWithoutAssignments = directWorkers.filter((worker: any) => 
                            !workerIdsWithAssignments.has(worker.id)
                          );
                          
                          if (workersWithoutAssignments.length > 0) {
                            const mappedWorkersWithoutAssignments = workersWithoutAssignments.map((worker: any) => ({
                              ...worker,
                              assignments: [], // No assignments yet
                              status: 'pending' // Default status
                            }));
                            clientWorkers = [...clientWorkers, ...mappedWorkersWithoutAssignments];
                          }
                          
                          if (clientWorkers.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <i className="fas fa-user-plus text-gray-400 text-3xl mb-4"></i>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers Found</h3>
                                <p className="text-gray-600 mb-4">This client doesn't have any workers assigned yet.</p>
                                <Button data-testid="button-add-first-worker">
                                  <i className="fas fa-plus mr-2"></i>
                                  Add First Worker
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {clientWorkers.map((worker: any, index: number) => (
                                <div 
                                  key={worker.id || index}
                                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedWorker(worker)}
                                  data-testid={`worker-${index}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-user text-blue-600 text-lg"></i>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">
                                          {worker.firstName && worker.lastName 
                                            ? `${worker.firstName} ${worker.lastName}`
                                            : `Worker #${index + 1}`}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {worker.nationality || 'Nationality pending'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Started: {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString('en-GB') : 'Date pending'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        worker.status === 'ACCEPTED' || worker.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        worker.status === 'SUBMITTED_BY_USER' || worker.status === 'RECEIVED_BY_ADMIN' || worker.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                        worker.status === 'AWAITING_UPLOAD' ? 'bg-yellow-100 text-yellow-800' :
                                        worker.status === 'REJECTED' || worker.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {worker.status === 'NOT_STARTED' ? 'Not Started' :
                                         worker.status === 'AWAITING_UPLOAD' ? 'Awaiting Upload' :
                                         worker.status === 'SUBMITTED_BY_USER' ? 'Submitted' :
                                         worker.status === 'RECEIVED_BY_ADMIN' ? 'Under Review' :
                                         worker.status === 'ACCEPTED' ? 'Accepted' :
                                         worker.status === 'REJECTED' ? 'Rejected' :
                                         worker.status || 'Pending'}
                                      </span>
                                      <div className="mt-1">
                                        <i className="fas fa-chevron-right text-gray-400"></i>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
              )}

              {/* Selected Worker Details Section - Mobile */}
              {activeSection === "clients" && selectedClient && selectedWorker && (
                    // Step 3: Show detailed workflow for selected worker
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center">
                              <i className="fas fa-clipboard-list mr-2"></i>
                              Immigration Workflow: {selectedWorker.firstName && selectedWorker.lastName 
                                ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                                : selectedWorker.workerName || 'Worker'
                              }
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Client: {selectedClient.legalName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedWorker(null)}
                            data-testid="button-back-to-workers-list"
                          >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Workers List
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Worker Information */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Worker Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Name:</span>
                                <span className="ml-2 font-medium">
                                  {selectedWorker.firstName && selectedWorker.lastName 
                                    ? `${selectedWorker.firstName} ${selectedWorker.lastName}`
                                    : selectedWorker.workerName || 'Name pending'
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Nationality:</span>
                                <span className="ml-2 font-medium">{selectedWorker.nationality || 'Pending'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 font-medium">{selectedWorker.email || selectedWorker.workerEmail || 'Pending'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Started:</span>
                                <span className="ml-2 font-medium">
                                  {selectedWorker.startDate || selectedWorker.createdAt 
                                    ? new Date(selectedWorker.startDate || selectedWorker.createdAt).toLocaleDateString('en-GB')
                                    : 'Date pending'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Workflow Status */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Immigration Process Status</h4>
                            <div className="space-y-4">
                              {/* AJOFM (Labor Market Test) */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-briefcase text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">AJOFM Labor Market Test</h5>
                                    <p className="text-sm text-gray-600">Romanian Employment Agency approval</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.ajofmStatus === 'completed' || selectedWorker.ajofmStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* IGI Work Permit */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-id-card text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">IGI Work Permit</h5>
                                    <p className="text-sm text-gray-600">Romanian Immigration Office work authorization</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.igiStatus === 'completed' || selectedWorker.igiStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* Consulate Visa */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-passport text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">Consulate Visa Application</h5>
                                    <p className="text-sm text-gray-600">Romanian consulate visa processing</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.visaStatus === 'completed' || selectedWorker.visaStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* Residence Permit */}
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <i className="fas fa-home text-sm"></i>
                                  </div>
                                  <div>
                                    <h5 className="font-medium">Residence Permit</h5>
                                    <p className="text-sm text-gray-600">Final residence permit in Romania</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedWorker.residenceStatus === 'completed' || selectedWorker.residenceStatus === 'approved' ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
              )}

              {/* Reports Section */}
              {activeSection === "reports" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    
                    {/* Client Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-client-overview">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-building text-blue-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Client Reports</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Comprehensive client analytics and performance metrics</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• Client Performance Overview</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Active vs Inactive Clients</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Client Timeline Analysis</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Revenue by Client</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Worker Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-worker-analysis">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-users text-green-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Worker Analytics</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Detailed worker progress and workflow analytics</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• Worker Status Distribution</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Progress by Nationality</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Average Processing Times</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Success Rate Analysis</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Workflow Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-workflow-metrics">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-route text-purple-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Workflow Metrics</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Stage-by-stage workflow performance analysis</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• Stage Completion Rates</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Bottleneck Identification</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Processing Time Trends</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Stage Performance Comparison</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-document-status">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-file-alt text-orange-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Document Analytics</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Document submission and approval tracking</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• Document Status Overview</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Approval/Rejection Rates</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Document Type Analysis</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Submission Timeline Trends</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-financial-overview">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-euro-sign text-yellow-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Financial Reports</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Revenue, costs, and financial performance metrics</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• Revenue by Service Type</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Monthly Financial Trends</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Cost Analysis by Stage</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Profitability by Client</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compliance Reports */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="report-compliance-audit">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-shield-alt text-red-600"></i>
                          </div>
                          <h3 className="text-lg font-semibold">Compliance & Audit</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Regulatory compliance and audit trail reports</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>• GDPR Compliance Status</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Audit Trail Summary</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Data Retention Reports</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Security Incident Logs</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Custom Report Builder */}
                  <Card data-testid="custom-report-builder">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-magic text-primary"></i>
                        <span>Custom Report Builder</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Data Source</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select data source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clients">Clients</SelectItem>
                              <SelectItem value="workers">Workers</SelectItem>
                              <SelectItem value="assignments">Assignments</SelectItem>
                              <SelectItem value="documents">Documents</SelectItem>
                              <SelectItem value="workflow">Workflow Stages</SelectItem>
                              <SelectItem value="financial">Financial Data</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Time Period</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="quarter">This Quarter</SelectItem>
                              <SelectItem value="year">This Year</SelectItem>
                              <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Export Format</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF Report</SelectItem>
                              <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                              <SelectItem value="csv">CSV Data</SelectItem>
                              <SelectItem value="chart">Interactive Chart</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center space-x-4">
                        <Button className="flex items-center space-x-2" data-testid="button-generate-report">
                          <i className="fas fa-chart-line"></i>
                          <span>Generate Report</span>
                        </Button>
                        <Button variant="outline" className="flex items-center space-x-2" data-testid="button-save-template">
                          <i className="fas fa-save"></i>
                          <span>Save as Template</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Requirements Section */}
              {activeSection === "requirements" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-list-check text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Requirements Management</h3>
                        <p className="text-secondary">Configure workflow requirements and validation rules</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Reminders Section */}
              {activeSection === "reminders" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-bell text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Reminders & Notifications</h3>
                        <p className="text-secondary">Set up automated reminders for deadlines and important dates</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Audit Section */}
              {activeSection === "audit" && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
                        <p className="text-secondary">Track all system activities and user actions for compliance</p>
                      </div>
                      {auditLogs.length > 0 && (
                        <div className="mt-6 space-y-4">
                          {auditLogs.slice(0, 10).map((log: any, index: number) => (
                            <div key={log.id || index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-info text-primary text-sm"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{log.action}</p>
                                <p className="text-xs text-secondary mt-1">
                                  {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            </>
          )}
        </div>

        {/* Edit Worker Dialog */}
        <Dialog open={editingWorker} onOpenChange={setEditingWorker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                <i className="fas fa-user-edit mr-2"></i>
                Edit Worker Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editWorkerForm.firstName}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editWorkerForm.lastName}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={editWorkerForm.nationality}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, nationality: e.target.value})}
                    placeholder="Enter nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editWorkerForm.email}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editWorkerForm.phone}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={editWorkerForm.passportNumber}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, passportNumber: e.target.value})}
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth <span className="italic">(dd/mm/yyyy)</span></Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editWorkerForm.dob}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, dob: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="passportExpiry">Passport Expiry Date <span className="italic">(dd/mm/yyyy)</span></Label>
                  <Input
                    id="passportExpiry"
                    type="date"
                    value={editWorkerForm.passportExpiry}
                    onChange={(e) => setEditWorkerForm({...editWorkerForm, passportExpiry: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingWorker(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const workerId = selectedWorker.worker?.id;
                      if (!workerId) {
                        toast({
                          title: "Error",
                          description: "Worker ID not found. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      }

                      const response = await apiRequest("PUT", `/api/workers/${workerId}`, editWorkerForm);
                      
                      if (response.ok) {
                        // Update the selected worker data locally
                        const updatedWorker = await response.json();
                        setSelectedWorker((prev: any) => ({
                          ...prev,
                          worker: updatedWorker,
                          // Also update the top-level fields for immediate UI refresh
                          firstName: updatedWorker.firstName,
                          lastName: updatedWorker.lastName,
                          nationality: updatedWorker.nationality,
                          email: updatedWorker.email,
                          phone: updatedWorker.phone,
                          passportNumber: updatedWorker.passportNumber,
                          dob: updatedWorker.dob,
                          passportExpiry: updatedWorker.passportExpiry
                        }));
                        
                        // Invalidate and refetch assignments to update all worker data throughout the app
                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients", selectedClient?.id, "assignments"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/dashboard/assignments"]
                        });
                        
                        toast({
                          title: "Profile Updated",
                          description: "Worker profile has been updated successfully.",
                        });
                        setEditingWorker(false);
                      } else {
                        throw new Error("Failed to update profile");
                      }
                    } catch (error) {
                      console.error("Error updating worker profile:", error);
                      toast({
                        title: "Error",
                        description: "Failed to update worker profile. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-save-worker-profile"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Worker Dialog */}
        <Dialog open={addingWorker} onOpenChange={setAddingWorker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addFirstName">First Name</Label>
                  <Input
                    id="addFirstName"
                    value={addWorkerForm.firstName}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="addLastName">Last Name</Label>
                  <Input
                    id="addLastName"
                    value={addWorkerForm.lastName}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addNationality">Nationality</Label>
                  <Input
                    id="addNationality"
                    value={addWorkerForm.nationality}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, nationality: e.target.value})}
                    placeholder="Enter nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="addEmail">Email</Label>
                  <Input
                    id="addEmail"
                    type="email"
                    value={addWorkerForm.email}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addPhone">Phone Number</Label>
                  <Input
                    id="addPhone"
                    value={addWorkerForm.phone}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="addPassportNumber">Passport Number</Label>
                  <Input
                    id="addPassportNumber"
                    value={addWorkerForm.passportNumber}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, passportNumber: e.target.value})}
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addDob">Date of Birth <span className="italic">(dd/mm/yyyy)</span></Label>
                  <Input
                    id="addDob"
                    type="date"
                    value={addWorkerForm.dob}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, dob: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="addPassportExpiry">Passport Expiry Date <span className="italic">(dd/mm/yyyy)</span></Label>
                  <Input
                    id="addPassportExpiry"
                    type="date"
                    value={addWorkerForm.passportExpiry}
                    onChange={(e) => setAddWorkerForm({...addWorkerForm, passportExpiry: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAddingWorker(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!selectedClient?.id) {
                        toast({
                          title: "Error",
                          description: "No client selected. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Create worker for the client with the form data
                      console.log("Submitting worker data:", addWorkerForm);
                      const response = await apiRequest("POST", `/api/clients/${selectedClient.id}/workers`, {
                        ...addWorkerForm
                      });
                      
                      console.log("Add worker response:", response);
                      if (response.ok) {
                        console.log("Worker added successfully, updating UI...");
                        // Update the selected client's worker count immediately
                        setSelectedClient((prev: any) => ({
                          ...prev,
                          activeWorkers: (prev.activeWorkers || 0) + 1
                        }));

                        // Update the client in the main clients list as well
                        queryClient.setQueryData(["/api/clients"], (oldClients: any[]) => {
                          if (!oldClients) return oldClients;
                          return oldClients.map(client => 
                            client.id === selectedClient.id
                              ? { ...client, activeWorkers: (client.activeWorkers || 0) + 1 }
                              : client
                          );
                        });

                        // Clear all cache entries that might contain stale worker data
                        console.log("Invalidating cache for client:", selectedClient.id);
                        console.log("NOTE: Workers are displayed based on assignments, not direct workers list!");
                        
                        // Clear the workers cache with multiple approaches
                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients", selectedClient.id, "workers"]
                        });
                        
                        // Also clear any cached workers query that might use different key format
                        queryClient.invalidateQueries({
                          predicate: (query) => {
                            return Array.isArray(query.queryKey) && 
                                   query.queryKey.includes("workers") && 
                                   query.queryKey.includes(selectedClient.id);
                          }
                        });
                        
                        // Clear related caches
                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients", selectedClient.id, "assignments"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/dashboard/assignments"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/dashboard/stats"]
                        });
                        
                        // Force immediate refetch of workers data
                        queryClient.refetchQueries({
                          queryKey: ["/api/clients", selectedClient.id, "workers"]
                        });
                        
                        toast({
                          title: "Worker Added",
                          description: "New worker has been added successfully.",
                        });
                        setAddingWorker(false);
                      } else {
                        throw new Error("Failed to add worker");
                      }
                    } catch (error) {
                      console.error("Error adding worker:", error);
                      toast({
                        title: "Error",
                        description: "Failed to add worker. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-save-new-worker"
                >
                  <i className="fas fa-save mr-2"></i>
                  Add Worker
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
  );
}
