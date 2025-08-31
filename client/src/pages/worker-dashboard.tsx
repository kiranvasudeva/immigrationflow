import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StageProgress from "@/components/progress/stage-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/LanguageContext";

export default function WorkerDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
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

  if (!isAuthenticated || user?.role !== 'WORKER') {
    return null;
  }

  // Real workflow data state
  const [workflowData, setWorkflowData] = useState(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);

  // Fetch workflow data for this worker
  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingWorkflow(true);
        const response = await fetch(`/api/workflow/worker/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setWorkflowData(data);
        } else {
          console.error('Failed to fetch workflow data:', response.statusText);
          // Fall back to empty data
          setWorkflowData(null);
        }
      } catch (error) {
        console.error('Error fetching workflow data:', error);
        setWorkflowData(null);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };

    fetchWorkflowData();
  }, [user?.id]);

  // Generate urgent actions and next steps from workflow data
  const urgentActions = workflowData?.stages?.filter(stage => stage.status === 'in-progress')
    .flatMap(stage => 
      stage.documentRequirements?.filter(doc => doc.required && doc.status === 'pending')
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          status: "urgent"
        })) || []
    ) || [];

  const nextSteps = workflowData?.stages?.filter(stage => stage.status === 'pending')
    .slice(0, 3) // Show next 3 upcoming stages
    .map(stage => ({
      id: stage.id,
      title: stage.name,
      description: stage.description,
      dueDate: new Date(Date.now() + (stage.estimatedDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })) || [];

  // Generate document list from workflow data
  const documents = workflowData?.stages?.flatMap(stage => 
    stage.documentRequirements?.map(doc => ({
      id: doc.id,
      name: doc.title,
      stage: stage.name,
      status: doc.status?.toUpperCase() || 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    })) || []
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="WORKER" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.worker.title') || "My Immigration Progress"}
          subtitle={t('dashboard.worker.subtitle') || "Track your Romanian work permit and residence application"}
        />

        <div className="p-8">
          {/* Progress Overview */}
          <StageProgress />

          {/* Current Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Urgent Actions */}
            <Card data-testid="card-urgent-actions">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
                  {t('worker.urgentActions') || 'Urgent Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isLoadingWorkflow ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading workflow data...</span>
                    </div>
                  ) : urgentActions.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      <p>No urgent actions at this time.</p>
                      <p className="text-sm">Great work! Keep up the progress.</p>
                    </div>
                  ) : (
                    urgentActions.map((action) => (
                    <div 
                      key={action.id}
                      className={`flex items-start p-4 rounded-lg border ${
                        action.status === 'overdue' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-orange-50 border-orange-200'
                      }`}
                      data-testid={`urgent-action-${action.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                        action.status === 'overdue' ? 'bg-error' : 'bg-warning'
                      }`}>
                        <i className="fas fa-file-upload text-white text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                        <p className="text-xs text-secondary mt-1">{action.description}</p>
                        <p className={`text-xs mt-2 ${
                          action.status === 'overdue' ? 'text-error' : 'text-warning'
                        }`}>
                          <i className="fas fa-clock mr-1"></i>
                          {action.status === 'overdue' ? (t('status.overdue') || 'Overdue') : `Due ${action.dueDate}`}
                        </p>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant={action.status === 'overdue' ? 'destructive' : 'default'}
                            data-testid={`button-upload-${action.id}`}
                          >
                            {t('action.uploadDocument') || 'Upload Document'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card data-testid="card-next-steps">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <i className="fas fa-list-check text-primary mr-2"></i>
                  {t('worker.nextSteps') || 'Next Steps'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {nextSteps.map((step, index) => (
                    <div 
                      key={step.id}
                      className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      data-testid={`next-step-${step.id}`}
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{step.title}</h4>
                        <p className="text-xs text-secondary mt-1">{step.description}</p>
                        <p className="text-xs text-primary mt-2">
                          <i className="fas fa-calendar mr-1"></i>
                          Due {step.dueDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Checklist */}
          <Card data-testid="card-document-checklist">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>{t('worker.myDocuments') || 'Document Checklist'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">{t('table.headers.document') || 'Document'}</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">{t('table.headers.stage') || 'Stage'}</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">{t('table.headers.status') || 'Status'}</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">{t('table.headers.dueDate') || 'Due Date'}</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">{t('table.headers.actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50" data-testid={`document-row-${doc.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              doc.status === 'SUBMITTED' ? 'bg-green-100' :
                              doc.status === 'OVERDUE' ? 'bg-red-100' : 'bg-orange-100'
                            }`}>
                              <i className={`text-sm ${
                                doc.status === 'SUBMITTED' ? 'fas fa-check text-success' :
                                doc.status === 'OVERDUE' ? 'fas fa-exclamation text-error' : 'fas fa-clock text-warning'
                              }`}></i>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline">{doc.stage}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant={
                              doc.status === 'SUBMITTED' ? 'default' :
                              doc.status === 'OVERDUE' ? 'destructive' : 'secondary'
                            }
                          >
                            {doc.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <p className={`text-sm ${
                            doc.status === 'OVERDUE' ? 'text-error' : 'text-gray-900'
                          }`}>
                            {doc.dueDate}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          {doc.status === 'SUBMITTED' ? (
                            <Button variant="ghost" size="sm" data-testid={`button-view-${doc.id}`}>
                              <i className="fas fa-eye mr-1"></i>View
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={doc.status === 'OVERDUE' ? 'destructive' : 'default'}
                              data-testid={`button-upload-doc-${doc.id}`}
                            >
                              Upload
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
