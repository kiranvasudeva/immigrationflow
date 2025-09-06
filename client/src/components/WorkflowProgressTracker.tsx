import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/I18nProvider';
import { apiRequest } from '@/lib/queryClient';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckSquare,
  Square,
  User,
  FileText,
  Calendar,
  Workflow,
  Plus,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { WorkflowTemplate, WorkerWorkflowProgress, WorkerStepProgress, DocumentRequirement, ChecklistItem } from '@shared/schema';

interface WorkflowProgressTrackerProps {
  workerId: string;
  userRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  showUploadPane?: boolean;
  showVerificationToggles?: boolean;
}

interface WorkflowProgressData {
  id: string;
  workerId: string;
  workflowTemplateId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  currentStepId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  workflowTemplate: {
    id: string;
    name: string;
    description: string | null;
    estimatedDays: number | null;
    steps: {
      id: string;
      name: string;
      description: string | null;
      stepType: string;
      assignedRole: string;
      order: number;
      isRequired: boolean;
      requiresApproval: boolean;
      documentRequirements: {
        id: string;
        title: string;
        description: string | null;
        isRequired: boolean;
        submittedBy: 'WORKER' | 'OWNER';
        acceptedFileTypes: string[];
      }[];
      checklistItems: {
        id: string;
        title: string;
        description: string | null;
        isRequired: boolean;
        assignedRole: string;
      }[];
    }[];
  };
  stepProgress: {
    id: string;
    stepId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'SKIPPED';
    startedAt: string | null;
    completedAt: string | null;
    notes: string | null;
    assignedToUserId: string | null;
  }[];
}

export default function WorkflowProgressTracker({
  workerId,
  userRole,
  showUploadPane = true,
  showVerificationToggles = true
}: WorkflowProgressTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch worker's workflow progress
  const { data: workerProgress, isLoading: progressLoading, error: progressError } = useQuery<WorkflowProgressData>({ 
    queryKey: ['/api/worker-workflow-progress', workerId],
    enabled: !!workerId,
  });

  // Fetch available workflow templates for assignment
  const { data: workflowTemplates, isLoading: templatesLoading } = useQuery<WorkflowTemplate[]>({
    queryKey: ['/api/workflow-templates'],
    enabled: !workerProgress && (userRole === 'ADMIN' || userRole === 'OWNER'),
  });

  // Assign workflow mutation
  const assignWorkflowMutation = useMutation({
    mutationFn: async (workflowTemplateId: string) => {
      return apiRequest('/api/worker-workflow-progress', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          workflowTemplateId
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Workflow Assigned",
        description: "The workflow has been successfully assigned to this worker."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worker-workflow-progress', workerId] });
      setShowAssignDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign workflow to worker.",
        variant: "destructive"
      });
    }
  });

  // Update step progress mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepProgressId, status, notes }: { stepProgressId: string, status: string, notes?: string }) => {
      return apiRequest(`/api/worker-step-progress/${stepProgressId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worker-workflow-progress', workerId] });
      toast({
        title: "Step Updated",
        description: "Step progress has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update step progress.",
        variant: "destructive"
      });
    }
  });

  // Permission helpers
  const canUserModifyStep = (step: any, stepProgress: any) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'OWNER' && (step.assignedRole === 'OWNER' || step.assignedRole === 'CLIENT')) return true;
    if (userRole === 'WORKER' && step.assignedRole === 'WORKER') return true;
    return false;
  };

  const canUserVerify = () => {
    return showVerificationToggles && (userRole === 'ADMIN' || userRole === 'OWNER');
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'IN_PROGRESS': return 'secondary';
      case 'REJECTED': return 'destructive';
      case 'SKIPPED': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (!workerProgress?.stepProgress) return 0;
    const completedSteps = workerProgress.stepProgress.filter(step => step.status === 'COMPLETED').length;
    const totalSteps = workerProgress.stepProgress.length;
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  if (progressLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Immigration Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-500">Loading workflow progress...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progressError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Failed to load workflow progress. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  // No workflow assigned - show assignment interface
  if (!workerProgress) {
    if (userRole === 'WORKER' || userRole === 'VIEWER') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Immigration Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflow Assigned</h3>
              <p className="text-sm text-gray-500">
                This worker has not been assigned to any immigration workflow yet.
                Please contact an administrator to assign a workflow.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Immigration Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflow Assigned</h3>
            <p className="text-sm text-gray-500 mb-4">
              Assign an immigration workflow to this worker to begin tracking their progress.
            </p>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-assign-workflow">
                  <Plus className="h-4 w-4" />
                  Assign Workflow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Immigration Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Workflow Template</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                      <SelectTrigger data-testid="select-workflow-template">
                        <SelectValue placeholder="Choose a workflow template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workflowTemplates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <Workflow className="h-4 w-4" />
                              <span>{template.name}</span>
                              {template.estimatedDays && (
                                <Badge variant="outline" className="text-xs ml-2">
                                  {template.estimatedDays} days
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignDialog(false)}
                      data-testid="button-cancel-assign"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => selectedWorkflow && assignWorkflowMutation.mutate(selectedWorkflow)}
                      disabled={!selectedWorkflow || assignWorkflowMutation.isPending}
                      data-testid="button-confirm-assign"
                    >
                      {assignWorkflowMutation.isPending ? 'Assigning...' : 'Assign Workflow'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Worker has assigned workflow - show progress
  const { workflowTemplate, stepProgress } = workerProgress;
  const progress = calculateProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          {workflowTemplate.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Workflow Overview */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            {workflowTemplate.description && (
              <p className="text-sm text-gray-600 mb-3">{workflowTemplate.description}</p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{progress}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" data-testid="progress-overall" />
              </div>
              <Badge variant={getStatusBadgeVariant(workerProgress.status)} data-testid="badge-workflow-status">
                {workerProgress.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {workflowTemplate.steps
              .sort((a, b) => a.order - b.order)
              .map((step) => {
                const stepProgressData = stepProgress.find(sp => sp.stepId === step.id);
                const isExpanded = expandedSteps.has(step.id);
                const canModify = stepProgressData ? canUserModifyStep(step, stepProgressData) : false;
                const status = stepProgressData?.status || 'PENDING';
                
                return (
                  <div key={step.id} className="border rounded-lg" data-testid={`step-container-${step.id}`}>
                    {/* Step Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50" 
                      onClick={() => toggleStepExpansion(step.id)}
                      data-testid={`step-header-${step.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {getStatusIcon(status)}
                          </div>
                          <div>
                            <h4 className="font-medium" data-testid={`step-name-${step.id}`}>{step.name}</h4>
                            {step.description && (
                              <p className="text-sm text-gray-600">{step.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(status)} data-testid={`step-status-${step.id}`}>
                            {status.replace('_', ' ')}
                          </Badge>
                          {step.assignedRole && (
                            <Badge variant="outline" className="text-xs">
                              {step.assignedRole}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step Details */}
                    {isExpanded && (
                      <div className="border-t p-4 space-y-4 bg-gray-50" data-testid={`step-details-${step.id}`}>
                        {/* Document Requirements */}
                        {step.documentRequirements.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Required Documents</Label>
                            {step.documentRequirements.map((docReq) => (
                              <div key={docReq.id} className="border rounded-lg p-3 bg-white" data-testid={`document-req-${docReq.id}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      {docReq.title}
                                      {docReq.isRequired && (
                                        <Badge variant="destructive" className="text-xs">Required</Badge>
                                      )}
                                    </h5>
                                    {docReq.description && (
                                      <p className="text-xs text-gray-600 mt-1">{docReq.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      Submitted by: {docReq.submittedBy}
                                    </p>
                                    {docReq.acceptedFileTypes.length > 0 && (
                                      <p className="text-xs text-gray-500">
                                        Accepted formats: {docReq.acceptedFileTypes.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  {showUploadPane && canModify && (
                                    <Button size="sm" variant="outline" data-testid={`button-upload-${docReq.id}`}>
                                      <Upload className="h-3 w-3 mr-1" />
                                      Upload
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Checklist Items */}
                        {step.checklistItems.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Checklist Items</Label>
                            {step.checklistItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white" data-testid={`checklist-item-${item.id}`}>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {canUserVerify() ? (
                                    <Switch size="sm" disabled={!canModify} data-testid={`switch-checklist-${item.id}`} />
                                  ) : (
                                    <Square className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{item.title}</span>
                                    {item.isRequired && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Assigned to: {item.assignedRole}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Step Actions */}
                        {canModify && stepProgressData && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {status === 'PENDING' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateStepMutation.mutate({
                                  stepProgressId: stepProgressData.id,
                                  status: 'IN_PROGRESS'
                                })}
                                disabled={updateStepMutation.isPending}
                                data-testid={`button-start-step-${step.id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start Step
                              </Button>
                            )}
                            {status === 'IN_PROGRESS' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateStepMutation.mutate({
                                  stepProgressId: stepProgressData.id,
                                  status: 'COMPLETED'
                                })}
                                disabled={updateStepMutation.isPending}
                                data-testid={`button-complete-step-${step.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete Step
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}