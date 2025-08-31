import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/I18nProvider";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import WorkerForm from "../forms/worker-form";
import { insertWorkerSchema } from "@shared/schema";
import { z } from "zod";

type WorkerFormData = z.infer<typeof insertWorkerSchema>;

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientProfileId: string;
}

export default function AddWorkerModal({ isOpen, onClose, clientProfileId }: AddWorkerModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createWorkerMutation = useMutation({
    mutationFn: async (data: WorkerFormData) => {
      const response = await apiRequest("POST", `/api/clients/${clientProfileId}/workers`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('notifications.success') || "Success",
        description: t('notifications.workerAdded') || "Worker added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientProfileId, "workers"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: t('notifications.error') || "Error",
        description: t('notifications.workerAddFailed') || "Failed to add worker. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: WorkerFormData) => {
    createWorkerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t('modals.addWorker.title') || 'Add New Worker'}</DialogTitle>
          <p className="text-sm text-secondary">
            {t('modals.addWorker.description') || "Enter the worker's personal information to add them to your client profile."}
          </p>
        </DialogHeader>

        <div className="mt-6">
          <WorkerForm 
            onSubmit={handleSubmit}
            isLoading={createWorkerMutation.isPending}
            clientProfileId={clientProfileId}
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={createWorkerMutation.isPending}
            data-testid="button-cancel-worker"
          >
            {t('actions.cancel') || 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
