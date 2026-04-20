import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Workflow, PaginatedRequest, WorkflowListResponse, CreateWorkflowPayload, WorkflowMutationResponse, UpdateWorkflowPayload, TriggerWorkflowPayload } from "../lib/types"

// ============================================
// Workflow Services
// ===========================================
export const useWorkflows = (params?: PaginatedRequest) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.list(params?.page || 1),
    queryFn: () => api.get<WorkflowListResponse>("/workflows", params),
  })
}

export const useWorkflow = (id: string) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.detail(id),
    queryFn: () => api.get<{ workflow: Workflow }>(`/workflows/${id}`),
    enabled: !!id,
  })
}

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWorkflowPayload) =>
      api.post<WorkflowMutationResponse>("/workflows", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.all() })
    },
  })
}

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowPayload }) =>
      api.put<WorkflowMutationResponse>(`/workflows/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.all() })
    },
  })
}

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.all() })
    },
  })
}

export const useToggleWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: "activate" | "deactivate" }) =>
      api.post<WorkflowMutationResponse>(`/workflows/${id}/${active}`),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.all() })
    },
  })
}

export const useTriggerWorkflow = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TriggerWorkflowPayload }) =>
      api.post(`/workflows/${id}/trigger`, data),
  })
}

export const useWorkflowExecutions = (workflowId: string, params?: PaginatedRequest) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.executions(workflowId),
    queryFn: () => api.get<WorkflowExecutionListResponse>(`/workflows/${workflowId}/executions`, params),
    enabled: !!workflowId,
  })
}
