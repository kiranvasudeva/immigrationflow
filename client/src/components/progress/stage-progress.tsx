import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/contexts/I18nProvider";
import { useQuery } from "@tanstack/react-query";

interface WorkflowProgressSummary {
  workflowName: string;
  totalSteps: number;
  completedSteps: number;
  currentStepName?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
}

export default function StageProgress({ workerId }: { workerId?: string }) {
  const { t } = useTranslation();
  
  // Fetch workflow progress from API
  const { data: progressData, isLoading } = useQuery<WorkflowProgressSummary[]>({
    queryKey: ['/api/workers', workerId, 'workflow-progress'],
    enabled: !!workerId
  });

  if (isLoading) {
    return (
      <Card className="mb-8" data-testid="card-stage-progress">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData?.length) {
    return (
      <Card className="mb-8" data-testid="card-stage-progress">
        <CardContent className="p-6">
          <CardTitle className="mb-6">{t('progress.overall') || 'Overall Progress'}</CardTitle>
          <p className="text-center text-muted-foreground py-8">
            {t('progress.noWorkflows') || 'No workflows assigned yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall progress across all workflows
  const totalSteps = progressData.reduce((acc, workflow) => acc + workflow.totalSteps, 0);
  const completedSteps = progressData.reduce((acc, workflow) => acc + workflow.completedSteps, 0);
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Card className="mb-8" data-testid="card-stage-progress">
      <CardContent className="p-6">
        <CardTitle className="mb-6">{t('progress.overall') || 'Overall Progress'}</CardTitle>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-secondary mb-2">
            <span>{t('common.progress') || 'Progress'}</span>
            <span data-testid="text-overall-progress">{overallProgress}% {t('common.complete') || 'Complete'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }}
              data-testid="progress-bar-overall"
            ></div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progressData.map((workflow, index) => {
            const workflowProgress = workflow.totalSteps > 0 
              ? Math.round((workflow.completedSteps / workflow.totalSteps) * 100) 
              : 0;
            
            const getStatusInfo = (status: string) => {
              switch (status) {
                case 'COMPLETED':
                  return { icon: 'fas fa-check', color: 'bg-green-500', textColor: 'text-green-600' };
                case 'IN_PROGRESS':
                  return { icon: 'fas fa-clock', color: 'bg-blue-500', textColor: 'text-blue-600' };
                case 'PAUSED':
                  return { icon: 'fas fa-pause', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
                case 'CANCELLED':
                  return { icon: 'fas fa-times', color: 'bg-red-500', textColor: 'text-red-600' };
                default:
                  return { icon: 'fas fa-circle', color: 'bg-gray-300', textColor: 'text-gray-600' };
              }
            };

            const statusInfo = getStatusInfo(workflow.status);

            return (
              <div key={index} className="text-center" data-testid={`workflow-${index}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${statusInfo.color}`}>
                  <i className={`${statusInfo.icon} text-white text-sm`}></i>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">{workflow.workflowName}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${workflowProgress}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${statusInfo.textColor} mb-1`}>
                  {workflowProgress}% {t('common.complete') || 'Complete'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workflow.completedSteps}/{workflow.totalSteps} {t('common.steps') || 'steps'}
                </p>
                {workflow.currentStepName && workflow.status === 'IN_PROGRESS' && (
                  <p className="text-xs text-blue-600 mt-1 italic">
                    {t('common.current') || 'Current'}: {workflow.currentStepName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
