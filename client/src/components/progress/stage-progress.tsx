import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/contexts/LanguageContext";

export default function StageProgress() {
  const { t } = useTranslation();
  // Mock progress data - would come from API based on worker's assignments
  const stages = [
    { key: 'AJOFM', title: 'AJOFM', status: 'completed', progress: 100 },
    { key: 'WORK_PERMIT', title: 'Work Permit', status: 'current', progress: 75 },
    { key: 'VISA', title: 'Visa D/AM', status: 'pending', progress: 0 },
    { key: 'RESIDENCE', title: 'Residence Permit', status: 'pending', progress: 0 }
  ];

  const overallProgress = Math.round(stages.reduce((acc, stage) => acc + stage.progress, 0) / stages.length);

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

        {/* Stage Progress */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage, index) => (
            <div key={stage.key} className="text-center" data-testid={`stage-${stage.key.toLowerCase()}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                stage.status === 'completed' ? 'bg-success' :
                stage.status === 'current' ? 'bg-primary' : 'bg-gray-300'
              }`}>
                {stage.status === 'completed' ? (
                  <i className="fas fa-check text-white"></i>
                ) : (
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{stage.title}</h3>
              <p className={`text-xs ${
                stage.status === 'completed' ? 'text-success' :
                stage.status === 'current' ? 'text-primary' : 'text-secondary'
              }`}>
                {stage.status === 'completed' ? (t('status.completed') || 'Completed') :
                 stage.status === 'current' ? (t('status.inProgress') || 'In Progress') : (t('status.pending') || 'Pending')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
