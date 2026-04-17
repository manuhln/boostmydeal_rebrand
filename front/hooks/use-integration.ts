import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Integration } from "../lib/types"

// ============================================
// Integration Services
// ============================================

export const useIntegrations = () => {
  return useQuery({
    queryKey: queryKey.Integrations.all(),
    queryFn: () => api.get("/integrations"),
  })
}

export const useIntegration = (id: string) => {
  return useQuery({
    queryKey: queryKey.Integrations.detail(id),
    queryFn: () => api.get(`/integrations/${id}`),
    enabled: !!id,
  })
}

export const useSaveIntegration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type, config }: { type: string; config: Record<string, unknown> }) =>
      api.post("/integrations", { type, config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Integrations.all() })
    },
  })
}

export const useTestIntegration = () => {
  return useMutation({
    mutationFn: ({ type, config }: { type: string; config: Record<string, unknown> }) =>
      api.post(`/integrations/${type}/test`, { config }),
  })
}

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (type: string) => api.delete(`/integrations/${type}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Integrations.all() })
    },
  })
}
