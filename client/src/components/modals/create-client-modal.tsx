import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ClientForm from "../forms/client-form";
import { insertClientProfileSchema } from "@shared/schema";
import { z } from "zod";

type ClientFormData = z.infer<typeof insertClientProfileSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client profile created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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
        description: "Failed to create client profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Client Profile</DialogTitle>
          <p className="text-sm text-secondary">
            Enter the Romanian company information to create a new client profile.
          </p>
        </DialogHeader>

        <div className="mt-6">
          <ClientForm 
            onSubmit={handleSubmit}
            isLoading={createClientMutation.isPending}
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={createClientMutation.isPending}
            data-testid="button-cancel-client"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
