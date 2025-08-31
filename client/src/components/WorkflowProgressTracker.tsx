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
  Calendar
} from 'lucide-react';

interface WorkflowProgressTrackerProps {
  workerId: string;
  userRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  showUploadPane?: boolean;
  showVerificationToggles?: boolean;
}

interface StepProgress {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  submittedBy: 'WORKER' | 'OWNER';
  acceptedFileTypes: string[];
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  assignedRole: 'WORKER' | 'OWNER';
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  stepType: string;
  assignedRole: string;
  order: number;
  isRequired: boolean;
  requiresApproval: boolean;
  progress: StepProgress;
  documentRequirements: DocumentRequirement[];
  checklistItems: ChecklistItem[];
}

interface WorkflowProgressData {
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  progress: {
    id: string;
    status: string;
    currentStepId?: string;
  };
  steps: WorkflowStep[];
}

export default function WorkflowProgressTracker({ 
  workerId, 
  userRole, 
  showUploadPane = true, 
  showVerificationToggles = true 
}: WorkflowProgressTrackerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});

  // Fetch worker workflow progress
  const { data: workflowData = [], isLoading, error } = useQuery<WorkflowProgressData[]>({
    queryKey: ['/api/workers', workerId, 'workflow-progress'],
    enabled: !!workerId,
  });

  // Mutation for updating step progress
  const updateStepProgressMutation = useMutation({
    mutationFn: async ({ progressId, stepId, status, notes }: {
      progressId: string;
      stepId: string;
      status: string;
      notes?: string;
    }) => {
      return apiRequest(`/api/workers/${workerId}/workflow-progress/${progressId}/steps/${stepId}`, {
        method: 'PUT',
        body: { status, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers', workerId, 'workflow-progress'] });
      toast({
        title: t('workflow.stepUpdated') || 'Step Updated',
        description: t('workflow.stepUpdateSuccess') || 'Step progress has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error.title') || 'Error',
        description: error.message || 'Failed to update step progress',
        variant: 'destructive',
      });
    }
  });

  // Mutation for updating checklist items
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ progressId, stepId, itemId, isCompleted, notes }: {
      progressId: string;
      stepId: string;
      itemId: string;
      isCompleted: boolean;
      notes?: string;
    }) => {
      return apiRequest(`/api/workers/${workerId}/workflow-progress/${progressId}/steps/${stepId}/checklist/${itemId}`, {
        method: 'POST',
        body: { isCompleted, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers', workerId, 'workflow-progress'] });
      toast({
        title: t('workflow.checklistUpdated') || 'Checklist Updated',
        description: t('workflow.checklistUpdateSuccess') || 'Checklist item has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error.title') || 'Error',
        description: error.message || 'Failed to update checklist item',
        variant: 'destructive',
      });
    }
  });

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'default',
      'IN_PROGRESS': 'secondary',
      'PENDING': 'outline',
      'REJECTED': 'destructive',
      'SKIPPED': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleStepStatusUpdate = (progressId: string, stepId: string, newStatus: string) => {
    const notes = stepNotes[stepId] || '';
    updateStepProgressMutation.mutate({
      progressId,
      stepId,
      status: newStatus,
      notes
    });
  };

  const handleChecklistToggle = (progressId: string, stepId: string, itemId: string, isCompleted: boolean) => {
    updateChecklistMutation.mutate({
      progressId,
      stepId,
      itemId,
      isCompleted
    });
  };

  const calculateOverallProgress = (steps: WorkflowStep[]) => {
    if (!steps.length) return 0;
    const completedSteps = steps.filter(step => step.progress.status === 'COMPLETED').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const canUserModifyStep = (step: WorkflowStep) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'OWNER' && (step.assignedRole === 'OWNER' || step.assignedRole === 'CLIENT')) return true;
    if (userRole === 'WORKER' && step.assignedRole === 'WORKER') return true;
    return false;
  };

  const canUserVerify = (item: ChecklistItem) => {
    return showVerificationToggles && (userRole === 'ADMIN' || userRole === 'OWNER');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load workflow progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflowData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>{t('workflow.noAssignedWorkflows') || 'No workflows assigned to this worker'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="workflow-progress-tracker">
      {workflowData.map((workflowItem) => {
        const overallProgress = calculateOverallProgress(workflowItem.steps);
        
        return (
          <Card key={workflowItem.workflow.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{workflowItem.workflow.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{workflowItem.workflow.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </CardHeader>
            
            <CardContent className="space-y-4">
              {workflowItem.steps.map((step, index) => {
                const isExpanded = expandedSteps.has(step.id);
                const canModify = canUserModifyStep(step);
                
                return (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleStepExpansion(step.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          {getStatusIcon(step.progress.status)}
                        </div>
                        <div>
                          <h4 className="font-medium">{step.name}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(step.progress.status)}
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {step.assignedRole}
                        </Badge>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        {/* Step Controls */}
                        {canModify && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Update Step Status</Label>
                            <div className="flex gap-2">
                              {step.progress.status !== 'IN_PROGRESS' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStepStatusUpdate(workflowItem.progress.id, step.id, 'IN_PROGRESS')}
                                  data-testid={`button-start-step-${step.id}`}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              )}
                              {step.progress.status === 'IN_PROGRESS' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStepStatusUpdate(workflowItem.progress.id, step.id, 'COMPLETED')}
                                  data-testid={`button-complete-step-${step.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`notes-${step.id}`}>Notes</Label>
                              <Textarea
                                id={`notes-${step.id}`}
                                placeholder="Add notes about this step..."
                                value={stepNotes[step.id] || ''}
                                onChange={(e) => setStepNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                                data-testid={`textarea-step-notes-${step.id}`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Document Requirements */}
                        {step.documentRequirements.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Document Requirements</Label>
                            <div className="space-y-2">
                              {step.documentRequirements.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{doc.title}</p>
                                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {doc.submittedBy}
                                      </Badge>
                                      {doc.isRequired && (
                                        <Badge variant="secondary" className="text-xs">Required</Badge>
                                      )}
                                    </div>
                                  </div>
                                  {showUploadPane && canModify && doc.submittedBy === (userRole === 'WORKER' ? 'WORKER' : 'OWNER') && (
                                    <Button size="sm" variant="outline" data-testid={`button-upload-${doc.id}`}>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Upload
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verification Checklist */}
                        {step.checklistItems.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Verification Checklist</Label>
                            <div className="space-y-2">
                              {step.checklistItems.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  {canUserVerify(item) ? (
                                    <Switch
                                      checked={false} // This would come from API data
                                      onCheckedChange={(checked) => handleChecklistToggle(workflowItem.progress.id, step.id, item.id, checked)}
                                      data-testid={`switch-checklist-${item.id}`}
                                    />
                                  ) : (
                                    <div className="mt-1">
                                      {false ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4 text-gray-400" />}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {item.assignedRole}
                                      </Badge>
                                      {item.isRequired && (
                                        <Badge variant="secondary" className="text-xs">Required</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step Timestamps */}
                        {(step.progress.startedAt || step.progress.completedAt) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {step.progress.startedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Started: {new Date(step.progress.startedAt).toLocaleDateString()}
                              </div>
                            )}
                            {step.progress.completedAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed: {new Date(step.progress.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}