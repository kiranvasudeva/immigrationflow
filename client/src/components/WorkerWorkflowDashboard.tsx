import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Workflow, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Download,
  Eye,
  User,
  Calendar,
  ChevronRight,
  Play,
  Pause,
  MoreVertical,
  FileCheck,
  ListChecks
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DocumentStatusTracker from '@/components/DocumentStatusTracker';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimatedDays: number | null;
  isActive: boolean;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  stepOrder: number;
  estimatedDays: number | null;
  assignedRole: 'WORKER' | 'ADMIN' | 'CLIENT';
  isRequired: boolean;
  documentRequirements: DocumentRequirement[];
  checklistItems: ChecklistItem[];
}

interface DocumentRequirement {
  id: string;
  stepId: string;
  title: string;
  description: string | null;
  required: boolean;
  acceptedFormats: string[];
}

interface ChecklistItem {
  id: string;
  stepId: string;
  title: string;
  description: string | null;
  required: boolean;
}

interface WorkerWorkflowProgress {
  id: string;
  workerId: string;
  templateId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
}

interface Props {
  workerId: string;
}

export default function WorkerWorkflowDashboard({ workerId }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [expandedWorkflows, setExpandedWorkflows] = useState<string[]>([]);

  // Fetch worker's assigned workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/workers', workerId, 'workflows'],
    staleTime: 5 * 60 * 1000,
  });

  // Toggle workflow expansion
  const toggleWorkflowExpansion = (workflowId: string) => {
    setExpandedWorkflows(prev => 
      prev.includes(workflowId) 
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Not Started' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Play, label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause, label: 'Paused' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStepStatusBadge = (step: WorkflowStep, isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge className="bg-blue-100 text-blue-800 gap-1">
          <Clock className="h-3 w-3" />
          Current
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const calculateWorkflowProgress = (workflow: WorkflowTemplate) => {
    // For now, simulate progress based on step order
    // In a real implementation, this would come from actual progress data
    const totalSteps = workflow.steps.length;
    const completedSteps = Math.floor(totalSteps * 0.3); // Simulate 30% completion
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    };
  };

  const renderDocumentRequirements = (requirements: DocumentRequirement[]) => {
    if (requirements.length === 0) return null;

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Document Requirements ({requirements.length})
        </h5>
        <div className="space-y-2">
          {requirements.map((req) => (
            <div key={req.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h6 className="font-medium text-sm">{req.title}</h6>
                    {req.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {req.description && (
                    <p className="text-xs text-gray-600 mt-1">{req.description}</p>
                  )}
                  {req.acceptedFormats.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted: {req.acceptedFormats.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button variant="outline" size="sm" data-testid={`button-upload-${req.id}`}>
                    <Upload className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-view-${req.id}`}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChecklistItems = (items: ChecklistItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Checklist Items ({items.length})
        </h5>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  className="mt-1 rounded" 
                  data-testid={`checkbox-${item.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h6 className="font-medium text-sm">{item.title}</h6>
                    {item.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (workflowsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if ((workflows as WorkflowTemplate[]).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Workflow className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Assigned</h3>
            <p className="text-gray-500">
              You don't have any workflows assigned yet. Contact your administrator to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Workflows</h2>
        <Badge variant="outline" className="gap-2">
          <Workflow className="h-4 w-4" />
          {(workflows as WorkflowTemplate[]).length} workflow{(workflows as WorkflowTemplate[]).length !== 1 ? 's' : ''} assigned
        </Badge>
      </div>

      <div className="space-y-4">
        {(workflows as WorkflowTemplate[]).map((workflow) => {
          const progress = calculateWorkflowProgress(workflow);
          const isExpanded = expandedWorkflows.includes(workflow.id);

          return (
            <Card key={workflow.id} className="border-l-4 border-l-blue-500">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full" 
                  onClick={() => toggleWorkflowExpansion(workflow.id)}
                >
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Workflow className="h-6 w-6 text-blue-600" />
                          <div className="text-left">
                            <CardTitle className="text-lg">{workflow.name}</CardTitle>
                            {workflow.description && (
                              <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusBadge('in_progress')}
                            <Badge variant="outline">{workflow.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={progress.percentage} className="w-24 h-2" />
                            <span className="text-sm text-gray-600">
                              {progress.completed}/{progress.total} steps
                            </span>
                          </div>
                          {workflow.estimatedDays && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {workflow.estimatedDays} days estimated
                            </p>
                          )}
                        </div>
                        
                        <ChevronRight 
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-6" />
                    
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Workflow Steps ({workflow.steps.length})
                      </h4>
                      
                      {workflow.steps
                        .sort((a, b) => a.stepOrder - b.stepOrder)
                        .map((step, index) => {
                          const isCompleted = index < progress.completed;
                          const isActive = index === progress.completed && progress.completed < workflow.steps.length;
                          
                          return (
                            <Card key={step.id} className={`border ${
                              isCompleted ? 'border-green-200 bg-green-50' :
                              isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                            }`}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`
                                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                      ${isCompleted ? 'bg-green-500 text-white' :
                                        isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
                                    `}>
                                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.stepOrder}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold">{step.title}</h5>
                                        {step.isRequired && (
                                          <Badge variant="destructive" className="text-xs">Required</Badge>
                                        )}
                                      </div>
                                      {step.description && (
                                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="h-3 w-3" />
                                        Assigned to: {step.assignedRole}
                                        {step.estimatedDays && (
                                          <>
                                            <Calendar className="h-3 w-3 ml-2" />
                                            {step.estimatedDays} days
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {getStepStatusBadge(step, isCompleted, isActive)}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem data-testid={`menu-view-step-${step.id}`}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem data-testid={`menu-mark-complete-${step.id}`}>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Mark Complete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                
                                {(step.documentRequirements.length > 0 || step.checklistItems.length > 0) && (
                                  <div className="space-y-4 border-t pt-4">
                                    {renderDocumentRequirements(step.documentRequirements)}
                                    {renderChecklistItems(step.checklistItems)}
                                    
                                    {/* Document Status Tracker for this step */}
                                    <div className="mt-6">
                                      <DocumentStatusTracker 
                                        assignmentId={`${workerId}-${step.id}`} 
                                        workflowStepProgressId={step.id}
                                        workerId={workerId}
                                        isReadOnly={false}
                                      />
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}