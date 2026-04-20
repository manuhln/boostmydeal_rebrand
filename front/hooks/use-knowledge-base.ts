import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { KnowledgeBase, KnowledgeBaseApiItem, KnowledgeBasePayload } from "../lib/types"

export const useKnowledgeBases = (params?: {
  "filter[name]"?: string
  "filter[document_type]"?: string
  sort?: string
}) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.all(),
    queryFn: () => api.get<{ data: KnowledgeBaseApiItem[]; meta?: unknown; links?: unknown }>("/knowledge-bases", params),
    select: (res) => ({
      ...res,
      data: res.data.map((item): KnowledgeBase => ({ id: item.id, ...item.attributes })),
    }),
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.detail(id),
    queryFn: () => api.get<{ data: KnowledgeBaseApiItem }>(`/knowledge-bases/${id}`),
    select: (res) => ({ id: res.data.id, ...res.data.attributes }) as KnowledgeBase,
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: KnowledgeBasePayload) => api.post("/knowledge-bases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.all() })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeBasePayload> }) =>
      api.put(`/knowledge-bases/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.all() })
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.detail(id) })
    },
  })
}

export const useDeleteKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge-bases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.all() })
    },
  })
}
