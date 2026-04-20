import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Call, CallApiItem, CallFilters, CreateCall, StartCallRequest } from "../lib/types"

export const useCalls = (params?: CallFilters) => {
  return useQuery({
    queryKey: queryKey.Calls.all(params?.page as number || 1),
    queryFn: () => api.get<{ data: CallApiItem[]; meta?: unknown; links?: unknown }>("/calls", params),
    select: (res) => ({
      ...res,
      data: res.data.map((item): Call => ({ id: item.id, ...item.attributes })),
    }),
  })
}

export const useCall = (id: string) => {
  return useQuery({
    queryKey: queryKey.Calls.detail(id),
    queryFn: () => api.get<Call>(`/calls/${id}`),
    enabled: !!id,
  })
}

// CRUD create — POST /calls
export const useCreateCall = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCall) => api.post<Call>("/calls", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Calls.all(1) })
    },
  })
}

// Initiate outbound call — POST /calls/start
export const useStartCall = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StartCallRequest) =>
      api.post<{ data: { call_id: string; message: string } }>("/calls/start", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Calls.all(1) })
    },
  })
}

export const useUpdateCall = (callId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreateCall>) => api.put<Call>(`/calls/${callId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Calls.all(1) })
      queryClient.invalidateQueries({ queryKey: queryKey.Calls.detail(callId) })
    },
  })
}

export const useDeleteCall = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/calls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Calls.all(1) })
    },
  })
}

export const useExportCalls = (params?: {
  start_date?: string
  end_date?: string
  "filter[status]"?: string
  "filter[direction]"?: string
}) => {
  return useQuery({
    queryKey: queryKey.Calls.export(),
    queryFn: () => api.get<string>("/calls/export-csv", params),
    enabled: false,
  })
}

export const useCallWebhooks = (callId: string) => {
  return useQuery({
    queryKey: queryKey.Calls.webhooks(callId),
    queryFn: () =>
      api.get<{ call_id: number; webhooks: unknown[]; total_webhooks: number }>(`/calls/${callId}/webhooks`),
    enabled: !!callId,
  })
}
