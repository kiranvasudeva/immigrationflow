import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Eye, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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

  // Fetch user-specific documents from API
  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['/api/user/documents'],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="default" className="bg-green-500">{t('status.accepted') || 'Accepted'}</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default" className="bg-blue-500">{t('status.submitted') || 'Submitted'}</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">{t('status.pendingUpload') || 'Pending Upload'}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{t('status.rejected') || 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{t('status.unknown') || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user?.role || 'VIEWER'} />
      
      <div className="ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('pages.documents.title') || 'Documents'}</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your immigration documents
              </p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-upload-document"
            >
              <Upload className="h-4 w-4" />
              <span>{t('actions.uploadDocument') || 'Upload Document'}</span>
            </Button>
          </div>

          {documentsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('status.loading') || 'Loading documents...'}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      {doc.name}
                    </CardTitle>
                    {getStatusBadge(doc.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {t('pages.documents.requiredFor') || 'Required for'}: {doc.assignment?.requirement || doc.requirement || 'Unknown'}
                    </p>
                    
                    {doc.uploadedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {t('pages.documents.uploaded') || 'Uploaded'}: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {doc.status === 'PENDING' || doc.status === 'AWAITING_UPLOAD' ? (
                        <Button size="sm" className="flex-1" data-testid={`button-upload-${doc.id}`}>
                          <Upload className="h-4 w-4 mr-1" />
                          {t('actions.upload') || 'Upload'}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${doc.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            {t('actions.view') || 'View'}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" data-testid={`button-download-${doc.id}`}>
                            <Download className="h-4 w-4 mr-1" />
                            {t('actions.download') || 'Download'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {documents.length === 0 && !documentsLoading && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('pages.documents.noDocuments') || 'No Documents Yet'}</h3>
                <p className="text-gray-600 mb-4">
                  {t('pages.documents.noDocumentsDescription') || 'Upload your first document to get started with your immigration process.'}
                </p>
                <Button className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>{t('actions.uploadFirstDocument') || 'Upload First Document'}</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}