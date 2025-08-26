import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Worker, InsertWorker } from "@shared/schema";

export function useWorkers(clientProfileId: string) {
  return useQuery<Worker[]>({
    queryKey: ["/api/clients", clientProfileId, "workers"],
    enabled: !!clientProfileId,
  });
}

export function useWorker(clientProfileId: string, workerId: string) {
  return useQuery<Worker>({
    queryKey: ["/api/clients", clientProfileId, "workers", workerId],
    enabled: !!clientProfileId && !!workerId,
  });
}

export function useCreateWorker(clientProfileId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertWorker) => {
      const response = await apiRequest("POST", `/api/clients/${clientProfileId}/workers`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientProfileId, "workers"] });
    },
  });
}

export function useUpdateWorker(clientProfileId: string, workerId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<InsertWorker>) => {
      const response = await apiRequest("PATCH", `/api/clients/${clientProfileId}/workers/${workerId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientProfileId, "workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientProfileId, "workers", workerId] });
    },
  });
}
