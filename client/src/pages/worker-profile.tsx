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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Globe, 
  CreditCard, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Eye
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import WorkerWorkflowDashboard from "@/components/WorkerWorkflowDashboard";

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

interface WorkerData {
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

export default function WorkerProfile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  
  // Extract worker ID from URL
  const workerId = location.split('/workers/')[1];
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: ''
  });

  // Fetch worker data
  const { data: worker, isLoading: workerLoading, error: workerError } = useQuery({
    queryKey: ['/api/workers', workerId],
    enabled: !!workerId && isAuthenticated,
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

  // Fetch workflow data for this worker
  const { data: workerWorkflowData, isLoading: workflowLoading } = useQuery<any>({
    queryKey: ['/api/workflow/worker', workerId],
    enabled: !!workerId && isAuthenticated,
  });

  // Update worker mutation
  const updateWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/workers/${workerId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workers', workerId] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Worker updated successfully",
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
        description: "Failed to update worker",
        variant: "destructive",
      });
    }
  });

  // Initialize form data when worker data loads
  useEffect(() => {
    if (worker) {
      setFormData({
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
        email: worker.email || '',
        phone: worker.phone || '',
        dob: worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : '',
        nationality: worker.nationality || '',
        passportNumber: worker.passportNumber || '',
        passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().split('T')[0] : ''
      });
    }
  }, [worker]);

  const handleSave = async () => {
    const submitData = {
      ...formData,
      dob: formData.dob ? new Date(formData.dob).toISOString() : null,
      passportExpiry: formData.passportExpiry ? new Date(formData.passportExpiry).toISOString() : null
    };
    await updateWorkerMutation.mutateAsync(submitData);
  };

  const handleCancel = () => {
    if (worker) {
      setFormData({
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
        email: worker.email || '',
        phone: worker.phone || '',
        dob: worker.dob ? new Date(worker.dob).toISOString().split('T')[0] : '',
        nationality: worker.nationality || '',
        passportNumber: worker.passportNumber || '',
        passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().split('T')[0] : ''
      });
    }
    setIsEditing(false);
  };

  // Calculate workflow progress from real workflow data
  const getWorkflowProgress = () => {
    if (!workerWorkflowData?.stages) return { overall: 0, stages: [] };
    
    const stages = workerWorkflowData.stages.map((stage: any, index: number) => ({
      key: stage.id,
      title: stage.name,
      order: index + 1,
      progress: stage.status === 'completed' ? 100 : stage.status === 'in-progress' ? 50 : 0,
      completed: stage.status === 'completed' ? 1 : 0,
      total: 1,
      status: stage.status === 'pending' ? 'not-started' : stage.status
    }));

    const overallProgress = stages.length > 0 ? 
      Math.round(stages.reduce((acc: number, stage: any) => acc + stage.progress, 0) / stages.length) : 0;

    return { overall: overallProgress, stages };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
      case 'SUBMITTED_TO_INSTITUTION_DIGITAL':
      case 'SUBMITTED_TO_INSTITUTION_COURIER':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>;
      case 'SUBMITTED_BY_USER':
      case 'RECEIVED_BY_ADMIN':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Under Review</Badge>;
      case 'AWAITING_UPLOAD':
        return <Badge variant="outline">Awaiting Upload</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'NOT_STARTED':
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  if (workerLoading || workflowLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !['ADMIN', 'OWNER'].includes(user.role)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const { overall, stages } = getWorkflowProgress();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar userRole={user.role} onSectionChange={() => {}} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(worker?.clientProfile ? `/clients/${worker.clientProfile.id}` : '/clients')}
                    data-testid="button-back-to-client"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to {worker?.clientProfile?.legalName || 'Clients'}
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {workerLoading ? 'Loading...' : `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim() || 'Worker Profile'}
                      </h1>
                      <p className="text-gray-600">
                        {workerLoading ? '' : worker?.nationality || 'No nationality provided'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      disabled={workerLoading}
                      data-testid="button-edit-worker"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Worker
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateWorkerMutation.isPending}
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateWorkerMutation.isPending}
                        data-testid="button-save-worker"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {workerLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : workerError ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-red-600">Failed to load worker data</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Workflow Dashboard */}
                  {workerId && (
                    <WorkerWorkflowDashboard workerId={workerId} />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            {isEditing ? (
                              <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="First name"
                                data-testid="input-first-name"
                              />
                            ) : (
                              <p className="text-gray-900" data-testid="text-first-name">
                                {worker?.firstName || 'Not provided'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            {isEditing ? (
                              <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Last name"
                                data-testid="input-last-name"
                              />
                            ) : (
                              <p className="text-gray-900" data-testid="text-last-name">
                                {worker?.lastName || 'Not provided'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                          </label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={formData.dob}
                              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                              data-testid="input-dob"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-dob">
                              {worker?.dob ? new Date(worker.dob).toLocaleDateString() : 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nationality
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.nationality}
                              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                              placeholder="Nationality"
                              data-testid="input-nationality"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-nationality">
                              {worker?.nationality || 'Not provided'}
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
                            Email Address
                          </label>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="email@example.com"
                              data-testid="input-email"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-email">
                              {worker?.email || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+40 XXX XXX XXX"
                              data-testid="input-phone"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-phone">
                              {worker?.phone || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passport Number
                          </label>
                          {isEditing ? (
                            <Input
                              value={formData.passportNumber}
                              onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                              placeholder="Passport number"
                              data-testid="input-passport-number"
                            />
                          ) : (
                            <p className="text-gray-900 font-mono" data-testid="text-passport-number">
                              {worker?.passportNumber || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passport Expiry
                          </label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={formData.passportExpiry}
                              onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                              data-testid="input-passport-expiry"
                            />
                          ) : (
                            <p className="text-gray-900" data-testid="text-passport-expiry">
                              {worker?.passportExpiry ? new Date(worker.passportExpiry).toLocaleDateString() : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Documents and Requirements */}
                  <Card data-testid="card-documents">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Documents & Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {workerWorkflowData ? (
                        <div className="space-y-6">
                          {/* Workflow Title */}
                          <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-900" data-testid="workflow-title">
                              {workerWorkflowData.name || 'No Workflow Assigned'}
                            </h3>
                            {workerWorkflowData.description && (
                              <p className="text-sm text-gray-600 mt-1">{workerWorkflowData.description}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              Progress: {Math.round((stages.filter((s: any) => s.status === 'completed').length / stages.length) * 100) || 0}% complete
                            </p>
                          </div>

                          {/* Workflow Stages */}
                          <div className="space-y-4">
                            {stages.map((stage: any) => (
                              <div key={stage.key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-medium text-gray-900" data-testid={`stage-title-${stage.key}`}>
                                    {stage.title}
                                  </h3>
                                  <Badge 
                                    variant={stage.status === 'completed' ? 'default' : stage.status === 'in-progress' ? 'secondary' : 'outline'}
                                    data-testid={`stage-status-${stage.key}`}
                                  >
                                    {stage.status === 'completed' ? 'COMPLETED' : 
                                     stage.status === 'in-progress' ? 'IN PROGRESS' : 'NOT STARTED'}
                                  </Badge>
                                </div>
                                
                                {/* Stage Document Requirements */}
                                {workerWorkflowData.stages?.find((s: any) => s.id === stage.key)?.documentRequirements?.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">Documents</h4>
                                    {workerWorkflowData.stages.find((s: any) => s.id === stage.key).documentRequirements.map((req: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-gray-900" data-testid={`document-title-${stage.key}-${idx}`}>
                                            {req.title}
                                          </h5>
                                          {req.description && (
                                            <p className="text-sm text-gray-600">{req.description}</p>
                                          )}
                                        </div>
                                        <Button variant="outline" size="sm" data-testid={`upload-document-${stage.key}-${idx}`}>
                                          <Upload className="h-4 w-4 mr-1" />
                                          Upload Document
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* No Documents Message */}
                                {(!workerWorkflowData.stages?.find((s: any) => s.id === stage.key)?.documentRequirements || 
                                  workerWorkflowData.stages.find((s: any) => s.id === stage.key)?.documentRequirements?.length === 0) && (
                                  <div className="text-center py-4">
                                    <p className="text-sm text-gray-500">No documents have been uploaded for this workflow stage yet.</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : workflowLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm text-gray-500">Loading workflow data...</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflow Assigned</h3>
                          <p className="text-sm text-gray-500">This worker has not been assigned to any workflow yet</p>
                        </div>
                      )}
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