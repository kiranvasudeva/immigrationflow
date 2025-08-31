import React from 'react';
import WorkerWorkflowAssignments from '@/components/WorkerWorkflowAssignments';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/contexts/I18nProvider';

export default function WorkflowAssignmentsPage() {
  const { t } = useTranslation();
  
  usePageTitle(t('nav.workflowAssignments'));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('nav.workflowAssignments')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('common.assignWorkflowsToWorkers')}
        </p>
      </div>
      
      <WorkerWorkflowAssignments />
    </div>
  );
}