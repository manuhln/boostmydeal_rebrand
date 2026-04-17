import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { AIAgent, PaginatedRequest } from "../lib/types"


export const useAgents = (params?: PaginatedRequest) => {
  return useQuery({
    queryKey: queryKey.Agent.list(params?.page ?? 1),
    queryFn: () => api.get("/agents", { params: params as Record<string, unknown> }),
  });
};


export const useAgent = (id: string) => {
  return useQuery({
    queryKey: queryKey.Agent.detail(id),
    queryFn: () => api.get(`/agents/${id}`),
    enabled: !!id,
  })
}

export const useCreateAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AIAgent) => api.post("/agents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Agent.all() })
    },
  })
}

export const useUpdateAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AIAgent> }) =>
      api.put(`/agents/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.Agent.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKey.Agent.all() })
    },
  })
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Agent.all() })
    },
  })
}
