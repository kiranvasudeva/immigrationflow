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
  userRole?: string;
}

export function WorkerWorkflowDisplay({ 
  workerId, 
  workflowData, 
  isLoading, 
  isAuthenticated,
  userRole 
}: WorkerWorkflowDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingStages, setUploadingStages] = useState<Set<string>>(new Set());
  
  // Check if user is admin - admins have full access to all actions
  const isAdmin = userRole === 'ADMIN';

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

  // Render stage-specific UI based on stage type and requirements
  const renderStageInterface = (stage: any) => {
    const stageType = stage.stageType; // Now comes from database enum
    const documents = stage.documentRequirements || [];
    
    switch (stageType) {
      case 'DOCUMENT_COLLECTION':
        return renderDocumentCollectionInterface(stage, documents);
      
      case 'DOCUMENT_REVIEW':
        return renderDocumentReviewInterface(stage, documents);
      
      case 'ADMIN_APPROVAL':
        return renderDocumentReviewInterface(stage, documents); // Admin approval uses review interface
      
      case 'INSTITUTIONAL_SUBMISSION':
        return renderSubmissionInterface(stage);
      
      case 'FORM_COMPLETION':
        return renderFormCompletionInterface(stage);
      
      case 'PAYMENT':
        return renderPaymentInterface(stage);
      
      default:
        // If no specific stageType, determine by document presence and stage name
        if (documents.length > 0) {
          return renderDocumentCollectionInterface(stage, documents);
        }
        return renderGeneralInterface(stage);
    }
  };

  // Document Collection Interface - Individual cards for each required document
  const renderDocumentCollectionInterface = (stage: any, documents: any[]) => {
    // Admins can always perform all document management actions
    const canManageDocuments = isAdmin || isAuthenticated;
    
    return (
      <div className="space-y-4">
      <h6 className="text-sm font-semibold text-gray-700 mb-3">Required Documents</h6>
      {documents.length === 0 ? (
        <div className="text-sm text-gray-500 italic">No specific documents required for this stage</div>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc: any, idx: number) => (
            <Card key={idx} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{doc.title}</span>
                      {doc.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{doc.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        Responsible: {doc.responsibleParty || stage.responsibleParty}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Upload Actions for this specific document */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <DocumentUploader 
                    workflowStepProgressId={`step-${stage.id}-doc-${idx}`}
                    workerId={workerId}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/workflow/worker', workerId] });
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* TODO: Implement photo capture */}}
                    data-testid={`button-photo-${stage.id}-${idx}`}
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Photo + OCR
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`button-view-${stage.id}-${idx}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    );
  };

  // Document Review Interface - Checklist with verification controls  
  const renderDocumentReviewInterface = (stage: any, documents: any[]) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h6 className="text-sm font-semibold text-gray-700">Document Review Checklist</h6>
        <Button
          variant="default"
          size="sm"
          onClick={() => handleVerifyDocuments(stage.id)}
          disabled={updateStepStatusMutation.isPending}
          data-testid={`button-approve-all-${stage.id}`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approve All Documents
        </Button>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-sm text-gray-500 italic">No documents to review</div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  data-testid={`checkbox-verify-${stage.id}-${idx}`}
                />
                <div>
                  <div className="font-medium text-sm">{doc.title}</div>
                  <div className="text-xs text-gray-600">
                    Check document completeness and accuracy
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" data-testid={`button-view-doc-${stage.id}-${idx}`}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" data-testid={`button-approve-${stage.id}-${idx}`}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Submission Interface - Progress tracking and status updates
  const renderSubmissionInterface = (stage: any) => (
    <div className="space-y-4">
      <h6 className="text-sm font-semibold text-gray-700">Administrative Processing</h6>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm text-blue-800">Ready for Submission</span>
        </div>
        <p className="text-xs text-blue-700 mb-3">
          All required documents have been collected and verified. Ready to submit to authorities.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-submit-${stage.id}`}
          >
            <Upload className="h-3 w-3 mr-1" />
            Submit Application
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid={`button-preview-${stage.id}`}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview Submission
          </Button>
        </div>
      </div>
    </div>
  );

  // Processing Interface - Status tracking for government/external processing
  const renderProcessingInterface = (stage: any) => (
    <div className="space-y-4">
      <h6 className="text-sm font-semibold text-gray-700">Processing Status</h6>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-sm text-yellow-800">Under Review</span>
        </div>
        <p className="text-xs text-yellow-700 mb-3">
          Application is being processed by the relevant authorities. Monitor status and respond to any requests.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid={`button-check-status-${stage.id}`}
          >
            <Download className="h-3 w-3 mr-1" />
            Check Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-mark-received-${stage.id}`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Mark as Received
          </Button>
        </div>
      </div>
    </div>
  );

  // Form Completion Interface - For completing administrative forms
  const renderFormCompletionInterface = (stage: any) => (
    <div className="space-y-4">
      <h6 className="text-sm font-semibold text-gray-700">Form Completion</h6>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-sm text-purple-800">Forms Required</span>
        </div>
        <p className="text-xs text-purple-700 mb-3">
          Complete all required forms and administrative paperwork for this stage.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            data-testid={`button-open-forms-${stage.id}`}
          >
            <FileText className="h-3 w-3 mr-1" />
            Open Forms
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-complete-forms-${stage.id}`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );

  // Payment Interface - For handling payment requirements
  const renderPaymentInterface = (stage: any) => (
    <div className="space-y-4">
      <h6 className="text-sm font-semibold text-gray-700">Payment Required</h6>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-4 w-4 text-green-600" />
          <span className="font-medium text-sm text-green-800">Government Fees</span>
        </div>
        <p className="text-xs text-green-700 mb-3">
          Payment required for government processing fees and administrative costs.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            data-testid={`button-process-payment-${stage.id}`}
          >
            <Download className="h-3 w-3 mr-1" />
            Process Payment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(stage.id)}
            disabled={updateStepStatusMutation.isPending}
            data-testid={`button-confirm-payment-${stage.id}`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirm Paid
          </Button>
        </div>
      </div>
    </div>
  );

  // General Interface - Basic completion controls
  const renderGeneralInterface = (stage: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );


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


            {/* Stage-Specific Admin Controls */}
            {isAuthenticated && (stage.status === 'available' || stage.status === 'in-progress') && (
              <div className="space-y-2 mt-4 pt-3 border-t">
                {renderStageInterface(stage)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}