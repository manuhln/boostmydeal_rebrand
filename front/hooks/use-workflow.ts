import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type {
  CreateWorkflowPayload,
  SaveWorkflowGraphPayload,
  TriggerWorkflowPayload,
  TriggerWorkflowResponse,
  UpdateWorkflowPayload,
  Workflow,
  WorkflowExecutionListResponse,
  WorkflowExecutionStatus,
  WorkflowListResponse,
  WorkflowMutationResponse,
  WorkflowTriggerType,
} from "../lib/types"

type ListWorkflowsParams = {
  is_active?: boolean
  trigger_type?: WorkflowTriggerType
  per_page?: number
  page?: number
}

export const useWorkflows = (params?: ListWorkflowsParams) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.list(params?.page ?? 1),
    queryFn: () => api.get<WorkflowListResponse>("/workflows", params),
  })
}

export const useWorkflow = (id: string) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.detail(id),
    queryFn: () => api.get<{ workflow: Workflow }>(`/workflows/${id}`),
    select: (res) => res.workflow,
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
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post<WorkflowMutationResponse>(
        `/workflows/${id}/${active ? "activate" : "deactivate"}`
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.all() })
    },
  })
}

export const useTriggerWorkflow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TriggerWorkflowPayload }) =>
      api.post<TriggerWorkflowResponse>(`/workflows/${id}/trigger`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.executions(id) })
    },
  })
}

type ListExecutionsParams = {
  status?: WorkflowExecutionStatus
  per_page?: number
  page?: number
}

export const useWorkflowExecutions = (
  workflowId: string,
  params?: ListExecutionsParams
) => {
  return useQuery({
    queryKey: queryKey.WorkFlows.executions(workflowId),
    queryFn: () =>
      api.get<WorkflowExecutionListResponse>(`/workflows/${workflowId}/executions`, params),
    enabled: !!workflowId,
  })
}

export const useSaveWorkflowGraph = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveWorkflowGraphPayload }) =>
      api.put<WorkflowMutationResponse>(`/workflows/${id}/graph`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.WorkFlows.detail(id) })
    },
  })
}
