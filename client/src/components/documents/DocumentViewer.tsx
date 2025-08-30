import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface DocumentViewerProps {
  assignmentId: string;
}

interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  kind: 'USER_UPLOAD' | 'ADMIN_RECEIPT' | 'GENERATED_PDF';
  s3Key: string;
  scanResult?: string;
  uploadedByUserId: string;
  createdAt: string;
  notes?: string;
}

export function DocumentViewer({ assignmentId }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents for this assignment
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/assignments', assignmentId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/assignments/${assignmentId}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    }
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
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'documents'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest("DELETE", `/api/documents/${documentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'documents'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  });

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedDocument || !newStatus) return;
    
    updateStatusMutation.mutate({
      documentId: selectedDocument.id,
      status: newStatus,
      notes: statusNotes
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getKindBadgeVariant = (kind: string) => {
    switch (kind) {
      case 'USER_UPLOAD': return 'default';
      case 'ADMIN_RECEIPT': return 'secondary';
      case 'GENERATED_PDF': return 'outline';
      default: return 'default';
    }
  };

  const getScanResultBadgeVariant = (scanResult?: string) => {
    switch (scanResult) {
      case 'CLEAN': return 'success';
      case 'INFECTED': return 'destructive';
      case 'SCAN_FAILED': return 'warning';
      case 'PENDING': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
        <p className="text-gray-600">No documents have been uploaded for this workflow stage yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Submitted Documents</h4>
      
      <div className="space-y-3">
        {documents.map((document: Document) => (
          <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <h5 className="font-medium text-gray-900">{document.fileName}</h5>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getKindBadgeVariant(document.kind)}>
                      {document.kind.replace('_', ' ')}
                    </Badge>
                    {document.scanResult && (
                      <Badge variant={getScanResultBadgeVariant(document.scanResult)}>
                        {document.scanResult}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/documents/${document.id}/view`, '_blank')}
                  data-testid={`button-view-${document.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  data-testid={`button-download-${document.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDocument(document);
                    setIsStatusDialogOpen(true);
                  }}
                  data-testid={`button-update-status-${document.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this document?')) {
                      deleteMutation.mutate(document.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`button-delete-${document.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {document.notes && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                <strong>Notes:</strong> {document.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Document Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDocument && (
              <div className="text-sm text-gray-600">
                Updating status for: <strong>{selectedDocument.fileName}</strong>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RESUBMISSION_REQUIRED">Resubmission Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status Notes</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}