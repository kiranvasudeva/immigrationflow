import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Eye, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Mock data - would come from API based on user's assignments
  const mockDocuments = [
    {
      id: "1",
      name: "Work Contract",
      type: "USER_UPLOAD",
      status: "SUBMITTED",
      uploadedAt: "2024-01-10",
      requirement: "IGI Work Permit"
    },
    {
      id: "2",
      name: "Criminal Background Check",
      type: "USER_UPLOAD", 
      status: "PENDING",
      uploadedAt: null,
      requirement: "FBI Background Check"
    },
    {
      id: "3",
      name: "Educational Certificate",
      type: "USER_UPLOAD",
      status: "ACCEPTED",
      uploadedAt: "2024-01-05",
      requirement: "Diploma Verification"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default" className="bg-blue-500">Submitted</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending Upload</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user?.role || 'VIEWER'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Documents</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your immigration documents
              </p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-upload-document"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDocuments.map((doc) => (
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
                      Required for: {doc.requirement}
                    </p>
                    
                    {doc.uploadedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {doc.status === 'PENDING' ? (
                        <Button size="sm" className="flex-1">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockDocuments.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first document to get started with your immigration process.
                </p>
                <Button className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload First Document</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}