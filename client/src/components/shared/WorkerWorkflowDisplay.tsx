import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText,
  Upload,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Download,
  ListChecks,
  Camera
} from 'lucide-react';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import DocumentStatusTracker from '@/components/DocumentStatusTracker';

interface WorkerWorkflowDisplayProps {
  workerId: string;
  workflowData: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function WorkerWorkflowDisplay({ 
  workerId, 
  workflowData, 
  isLoading, 
  isAuthenticated 
}: WorkerWorkflowDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingStages, setUploadingStages] = useState<Set<string>>(new Set());

  // Status update mutation for workflow stages
  const updateStepStatusMutation = useMutation({
    mutationFn: async ({ stepId, status, notes }: { stepId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/workflow/worker/${workerId}/step/${stepId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      if (!response.ok) throw new Error('Failed to update step status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow step status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflow/worker', workerId] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update workflow step status",
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
      case 'available':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'locked':
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
      case 'available':
        return 'secondary';
      case 'locked':
      case 'pending':
      default:
        return 'outline';
    }
  };

  const handleMarkComplete = (stageId: string) => {
    updateStepStatusMutation.mutate({
      stepId: stageId,
      status: 'completed',
      notes: 'Marked as complete by admin'
    });
  };

  // Handle document verification
  const handleVerifyDocuments = async (stepId: string) => {
    updateStepStatusMutation.mutate({
      stepId,
      status: 'verified',
      notes: 'Documents verified by admin'
    });
  };

  // Render stage-specific actions based on stage type and requirements
  const renderStageActions = (stage: any) => {
    const stageType = stage.stageType || 'document_collection';
    const hasDocuments = stage.documentRequirements && stage.documentRequirements.length > 0;
    
    return (
      <div className="flex flex-wrap items-center gap-2">
        {/* Document Upload Actions */}
        {hasDocuments && (
          <>
            <DocumentUploader 
              workflowStepProgressId={`step-${stage.id}`}
              workerId={workerId}
              onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/workflow/worker', workerId] });
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement photo capture */}}
              data-testid={`button-photo-capture-${stage.id}`}
            >
              <Camera className="h-3 w-3 mr-1" />
              Photo + OCR
            </Button>
          </>
        )}

        {/* Verification Actions */}
        {(stageType === 'verification' || stageType === 'review' || hasDocuments) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVerifyDocuments(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-verify-${stage.id}`}
          >
            <ListChecks className="h-3 w-3 mr-1" />
            Verify & Approve
          </Button>
        )}

        {/* Administrative Actions */}
        {(stageType === 'administrative' || stageType === 'submission') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-process-${stage.id}`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Process & Submit
          </Button>
        )}

        {/* General completion for other stage types */}
        {!hasDocuments && stageType !== 'verification' && stageType !== 'review' && stageType !== 'administrative' && stageType !== 'submission' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-complete-${stage.id}`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Mark Complete
          </Button>
        )}
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading workflow data...</span>
      </div>
    );
  }

  if (!workflowData || !workflowData.stages || workflowData.stages.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No workflow assigned to this worker</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h4 className="font-semibold text-gray-900">{workflowData.name}</h4>
        {workflowData.description && (
          <p className="text-sm text-gray-600 mt-1">{workflowData.description}</p>
        )}
      </div>

      {/* Display workflow stages */}
      {workflowData.stages.map((stage: any, index: number) => (
        <Card key={stage.id} className={`border ${
          stage.status === 'completed' ? 'border-green-200 bg-green-50' :
          stage.status === 'in-progress' || stage.status === 'available' ? 'border-blue-200 bg-blue-50' : 
          'border-gray-200'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Stage {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(stage.status)}
                  <div className="font-medium text-sm">{stage.name}</div>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(stage.status)}>
                {stage.status || 'pending'}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-600 mb-3">
              {stage.description}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Responsible: {stage.responsibleParty}
              </span>
              {stage.estimatedDays && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Est. {stage.estimatedDays} days
                </span>
              )}
            </div>

            {/* Document Requirements */}
            {stage.documentRequirements && stage.documentRequirements.length > 0 && (
              <div className="space-y-3 border-t pt-3">
                <h6 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Required Documents ({stage.documentRequirements.length})
                </h6>
                
                <div className="space-y-2">
                  {stage.documentRequirements.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{doc.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{doc.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{doc.responsibleParty || stage.responsibleParty}</Badge>
                          {doc.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-3">
                        <DocumentUploader 
                          workflowStepProgressId={`step-${stage.id}`}
                          workerId={workerId}
                          onUploadComplete={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/workflow/worker', workerId] });
                          }}
                        />
                        <Button variant="outline" size="sm" data-testid={`button-view-docs-${doc.id || idx}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Document Status Tracker */}
                <div className="mt-4">
                  <DocumentStatusTracker 
                    workflowStepProgressId={stage.id}
                    workerId={workerId}
                    isReadOnly={false}
                  />
                </div>
              </div>
            )}

            {/* Stage-Specific Admin Controls */}
            {isAuthenticated && (stage.status === 'available' || stage.status === 'in-progress') && (
              <div className="space-y-2 mt-4 pt-3 border-t">
                {renderStageActions(stage)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}