import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createWorkerMutation = useMutation({
    mutationFn: async (data: WorkerFormData) => {
      const response = await apiRequest("POST", `/api/clients/${clientProfileId}/workers`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientProfileId, "workers"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Error",
        description: "Failed to add worker. Please try again.",
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
          <DialogTitle className="text-xl font-semibold">Add New Worker</DialogTitle>
          <p className="text-sm text-secondary">
            Enter the worker's personal information to add them to your client profile.
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
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
