import { useState } from "react";
import { useTranslation } from "@/contexts/I18nProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Worker } from "@shared/schema";
import { WorkerInvitationLink } from "@/components/worker-invitation-link";

interface WorkerListProps {
  workers: Worker[];
}

export default function WorkerList({ workers }: WorkerListProps) {
  const { t } = useTranslation();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("WORKER");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInvitationMutation = useMutation({
    mutationFn: async (invitationData: { email: string; role: string }) => {
      return apiRequest("POST", "/api/invitations", invitationData);
    },
    onSuccess: (data: any) => {
      toast({
        title: t('notifications.invitationSent') || "Invitation sent successfully",
        description: `${t('worker.invitationLink') || 'Invitation Link'}: ${data.inviteLink}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setShowInviteDialog(false);
      setInviteEmail("");
    },
    onError: (error) => {
      toast({
        title: t('notifications.invitationFailed') || "Failed to send invitation",
        description: t('notifications.tryAgainLater') || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail) return;
    
    createInvitationMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };
  // Hook to fetch workflow progress for each worker
  const useWorkerWorkflowData = (workerId: string) => {
    return useQuery({
      queryKey: ['/api/workers', workerId, 'workflow-progress'],
      enabled: !!workerId,
      select: (data: any[]) => {
        if (!data || data.length === 0) {
          return { stage: 'Not Assigned', progress: 0, nextDeadline: null };
        }
        
        // Get the first workflow's progress
        const workflow = data[0];
        const completedSteps = workflow.steps?.filter((step: any) => step.status === 'COMPLETED')?.length || 0;
        const totalSteps = workflow.steps?.length || 1;
        const progress = Math.round((completedSteps / totalSteps) * 100);
        
        // Find next pending step with deadline
        const nextStep = workflow.steps?.find((step: any) => step.status === 'PENDING');
        const nextDeadline = nextStep?.deadline ? {
          date: new Date(nextStep.deadline).toLocaleDateString(),
          description: nextStep.title
        } : null;
        
        return {
          stage: workflow.workflowName || 'In Progress',
          progress,
          nextDeadline
        };
      }
    });
  };

  // WorkerRow component that uses the workflow data hook
  function WorkerRow({ worker }: { worker: any }) {
    const { data: workflowData = { stage: 'Not Assigned', progress: 0, nextDeadline: null } } = useWorkerWorkflowData(worker.id);
    const initials = `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
    
    return (
      <tr className="hover:bg-gray-50" data-testid={`worker-row-${worker.id}`}>
        <td className="py-4 px-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-indigo-600">{initials}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{worker.firstName} {worker.lastName}</p>
              <p className="text-sm text-secondary">{worker.email}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-6">
          <Badge variant="outline">{worker.nationality}</Badge>
        </td>
        <td className="py-4 px-6">
          <Badge variant="secondary">{workflowData.stage}</Badge>
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
              <div 
                className="bg-success h-2 rounded-full" 
                style={{ width: `${workflowData.progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-secondary">{workflowData.progress}%</span>
          </div>
        </td>
        <td className="py-4 px-6">
          {workflowData.nextDeadline ? (
            <>
              <p className="text-sm text-gray-900">{workflowData.nextDeadline.date}</p>
              <p className="text-xs text-warning">{workflowData.nextDeadline.description}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No deadline</p>
          )}
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid={`button-view-worker-${worker.id}`}>
              <i className="fas fa-eye mr-1"></i>{t('actions.view') || 'View'}
            </Button>
            <Button variant="ghost" size="sm" data-testid={`button-edit-worker-${worker.id}`}>
              <i className="fas fa-edit mr-1"></i>{t('actions.edit') || 'Edit'}
            </Button>
            <WorkerInvitationLink 
              workerId={worker.id} 
              workerEmail={worker.email || ''}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <Card data-testid="card-workers-list">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>{t('common.workers') || 'Workers'}</CardTitle>
          <div className="flex items-center space-x-3">
            <Input 
              placeholder={t('form.placeholders.searchWorkers') || 'Search workers...'} 
              className="w-64"
              data-testid="input-search-workers"
            />
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-invite-worker">
                  <i className="fas fa-envelope mr-2"></i>{t('modals.inviteWorker.title') || 'Invite Worker'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby="invite-dialog-description">
                <DialogHeader>
                  <DialogTitle>{t('modals.inviteWorker.title') || 'Invite Worker'}</DialogTitle>
                </DialogHeader>
                <p id="invite-dialog-description" className="text-sm text-muted-foreground">
                  {t('modals.inviteWorker.description') || 'Send an invitation link to add a new worker to the system.'}
                </p>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="invite-email">{t('form.labels.emailAddress') || 'Email address'}</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="worker@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-role">{t('form.labels.role') || 'Role'}</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORKER">{t('roles.worker') || 'Worker'}</SelectItem>
                        <SelectItem value="VIEWER">{t('roles.viewer') || 'Viewer'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowInviteDialog(false)}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendInvite}
                      disabled={!inviteEmail || createInvitationMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      {createInvitationMutation.isPending ? "Sending..." : "Send Invite"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button data-testid="button-add-worker-list">
              <i className="fas fa-plus mr-2"></i>Add Worker
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Worker</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Nationality</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Current Stage</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Progress</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Next Deadline</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="text-center">
                      <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                      <p className="text-secondary">No workers added yet</p>
                      <Button className="mt-4" data-testid="button-add-first-worker">
                        <i className="fas fa-plus mr-2"></i>Add First Worker
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <WorkerRow key={worker.id} worker={worker} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
