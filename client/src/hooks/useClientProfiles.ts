import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ClientProfile, InsertClientProfile } from "@shared/schema";

export function useClientProfiles() {
  return useQuery<ClientProfile[]>({
    queryKey: ["/api/clients"],
  });
}

export function useClientProfile(id: string) {
  return useQuery<ClientProfile>({
    queryKey: ["/api/clients", id],
    enabled: !!id,
  });
}

export function useCreateClientProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertClientProfile) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useUpdateClientProfile(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<InsertClientProfile>) => {
      const response = await apiRequest("PATCH", `/api/clients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
    },
  });
}
