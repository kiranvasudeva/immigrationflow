import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Upload, 
  Download,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  FileX,
  ListChecks,
  MoreVertical,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface DocumentFile {
  id: string;
  assignmentId?: string;
  workflowStepProgressId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  kind: 'USER_UPLOAD' | 'ADMIN_RECEIPT' | 'GENERATED_PDF';
  s3Key: string;
  scanResult?: string;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface VerificationChecklist {
  id: string;
  documentId: string;
  title: string;
  description: string;
  isRequired: boolean;
  isChecked: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

interface Props {
  assignmentId?: string;
  workflowStepProgressId?: string;
  workerId?: string;
  isReadOnly?: boolean;
}

export default function DocumentStatusTracker({ assignmentId, workflowStepProgressId, workerId, isReadOnly = false }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);

  // Fetch documents (either for assignment or workflow step progress)
  const documentsQueryKey = workflowStepProgressId && workerId
    ? ['/api/workers', workerId, 'step-progress', workflowStepProgressId, 'documents']
    : ['/api/assignments', assignmentId, 'documents'];
    
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: documentsQueryKey,
    enabled: !!(assignmentId || (workflowStepProgressId && workerId)),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch verification checklist for selected document
  const { data: checklist = [], isLoading: checklistLoading } = useQuery({
    queryKey: ['/api/documents', selectedDocument?.id, 'checklist'],
    enabled: !!selectedDocument?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Update document status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { documentId: string, status: string, notes?: string }) => {
      const response = await apiRequest("PUT", `/api/documents/${data.documentId}/status`, {
        status: data.status,
        notes: data.notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document status updated successfully",
      });
      setIsStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
      setSelectedDocument(null);
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  });

  // Update checklist item mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (data: { checklistId: string, isChecked: boolean, notes?: string }) => {
      const response = await apiRequest("PUT", `/api/documents/checklist/${data.checklistId}`, {
        isChecked: data.isChecked,
        notes: data.notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents', selectedDocument?.id, 'checklist'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
    }
  });

  // Download document
  const downloadDocument = async (document: DocumentFile) => {
    try {
      const response = await apiRequest("GET", `/api/documents/${document.id}/download`);
      const data = await response.json();
      
      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800', icon: FileX, label: 'Rejected' },
      requires_changes: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Needs Changes' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getKindBadge = (kind: string) => {
    const kindConfig = {
      USER_UPLOAD: { color: 'bg-blue-100 text-blue-800', label: 'User Upload' },
      ADMIN_RECEIPT: { color: 'bg-purple-100 text-purple-800', label: 'Admin Receipt' },
      GENERATED_PDF: { color: 'bg-green-100 text-green-800', label: 'Generated PDF' },
    };

    const config = kindConfig[kind as keyof typeof kindConfig] || kindConfig.USER_UPLOAD;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const calculateDocumentProgress = () => {
    const typedDocuments = documents as DocumentFile[];
    if (typedDocuments.length === 0) return { verified: 0, total: 0, percentage: 0 };
    
    const verified = typedDocuments.filter((doc: DocumentFile) => doc.status === 'verified').length;
    const total = typedDocuments.length;
    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    return { verified, total, percentage };
  };

  const handleStatusUpdate = async () => {
    if (!selectedDocument || !newStatus) return;
    
    await updateStatusMutation.mutateAsync({
      documentId: selectedDocument.id,
      status: newStatus,
      notes: statusNotes
    });
  };

  const handleChecklistUpdate = async (checklistId: string, isChecked: boolean) => {
    await updateChecklistMutation.mutateAsync({
      checklistId,
      isChecked
    });
  };

  const progress = calculateDocumentProgress();

  if (documentsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Document Status & Verification
            </CardTitle>
            <Badge variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              {(documents as DocumentFile[]).length} document{(documents as DocumentFile[]).length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Verification Progress</span>
              <span className="font-medium">
                {progress.verified}/{progress.total} verified ({progress.percentage}%)
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {(documents as DocumentFile[]).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
              <p className="text-gray-500">
                No documents have been uploaded for this workflow step yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(documents as DocumentFile[]).map((document) => (
            <Card key={document.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg truncate">{document.fileName}</h4>
                        {getStatusBadge(document.status)}
                        {getKindBadge(document.kind)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Uploaded: {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Size: {Math.round(document.fileSize / 1024)} KB
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          By: {document.uploadedByUserId}
                        </div>
                        {document.verifiedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified: {format(new Date(document.verifiedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                      
                      {document.verificationNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Verification Notes:</span>
                          </div>
                          <p className="text-sm text-gray-600">{document.verificationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadDocument(document)}
                      data-testid={`button-download-${document.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedDocument(document);
                        setIsChecklistDialogOpen(true);
                      }}
                      data-testid={`button-checklist-${document.id}`}
                    >
                      <ListChecks className="h-4 w-4" />
                    </Button>
                    
                    {!isReadOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedDocument(document);
                              setNewStatus(document.status);
                              setStatusNotes(document.verificationNotes || '');
                              setIsStatusDialogOpen(true);
                            }}
                            data-testid={`menu-update-status-${document.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem data-testid={`menu-view-${document.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Document Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Document</label>
              <p className="text-sm text-gray-600">{selectedDocument?.fileName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="requires_changes">Requires Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Verification Notes</label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this verification..."
                rows={3}
                data-testid="textarea-status-notes"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
                data-testid="button-cancel-status"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending || !newStatus}
                data-testid="button-save-status"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Checklist Dialog */}
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedDocument?.fileName}</p>
              <p className="text-sm text-gray-600">Complete the verification checklist for this document</p>
            </div>
            
            <Separator />
            
            {checklistLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (checklist as VerificationChecklist[]).length === 0 ? (
              <div className="text-center py-8">
                <ListChecks className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No checklist items configured for this document type.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(checklist as VerificationChecklist[]).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={(e) => handleChecklistUpdate(item.id, e.target.checked)}
                      className="mt-1 rounded"
                      disabled={isReadOnly || updateChecklistMutation.isPending}
                      data-testid={`checkbox-checklist-${item.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{item.title}</h5>
                        {item.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      {item.checkedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Checked on {format(new Date(item.checkedAt), 'MMM dd, yyyy')} by {item.checkedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsChecklistDialogOpen(false)}
                data-testid="button-close-checklist"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}