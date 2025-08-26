import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
        title: "Invitation sent successfully",
        description: `Invitation link: ${data.inviteLink}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setShowInviteDialog(false);
      setInviteEmail("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send invitation",
        description: "Please try again later",
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
  // Mock additional data that would come from assignments
  const getWorkerProgress = (workerId: string) => {
    // Mock progress calculation
    return Math.floor(Math.random() * 100);
  };

  const getWorkerStage = (workerId: string) => {
    const stages = ['AJOFM', 'Work Permit', 'Visa D/AM', 'Residence Permit'];
    return stages[Math.floor(Math.random() * stages.length)];
  };

  const getNextDeadline = (workerId: string) => {
    // Mock deadline
    return {
      date: 'Jan 15, 2024',
      description: 'Work contract due'
    };
  };

  return (
    <Card data-testid="card-workers-list">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>Workers</CardTitle>
          <div className="flex items-center space-x-3">
            <Input 
              placeholder={t('form.placeholders.searchWorkers') || 'Search workers...'} 
              className="w-64"
              data-testid="input-search-workers"
            />
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-invite-worker">
                  <i className="fas fa-envelope mr-2"></i>Invite Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby="invite-dialog-description">
                <DialogHeader>
                  <DialogTitle>Invite Worker</DialogTitle>
                </DialogHeader>
                <p id="invite-dialog-description" className="text-sm text-muted-foreground">
                  Send an invitation link to add a new worker to the system.
                </p>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="invite-email">Email address</Label>
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
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORKER">Worker</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
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
                workers.map((worker) => {
                  const progress = getWorkerProgress(worker.id);
                  const stage = getWorkerStage(worker.id);
                  const deadline = getNextDeadline(worker.id);
                  const initials = `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
                  
                  return (
                    <tr key={worker.id} className="hover:bg-gray-50" data-testid={`worker-row-${worker.id}`}>
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
                        <Badge variant="secondary">{stage}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-success h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-secondary">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{deadline.date}</p>
                        <p className="text-xs text-warning">{deadline.description}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-worker-${worker.id}`}>
                            <i className="fas fa-eye mr-1"></i>View
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-worker-${worker.id}`}>
                            <i className="fas fa-edit mr-1"></i>Edit
                          </Button>
                          <WorkerInvitationLink 
                            workerId={worker.id} 
                            workerEmail={worker.email}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
