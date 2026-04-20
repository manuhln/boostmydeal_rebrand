import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { KnowledgeBase } from "../lib/types"

export const useKnowledgeBases = (params?: {
  "filter[name]"?: string
  "filter[document_type]"?: string
  "filter[agents]"?: string
  sort?: string
}) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.all(),
    queryFn: () => api.get<{ data: KnowledgeBase[] }>("/knowledge-bases", params),
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.detail(id),
    queryFn: () => api.get<KnowledgeBase>(`/knowledge-bases/${id}`),
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; document_type?: string }) =>
      api.post<KnowledgeBase>("/knowledge-bases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.all() })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; document_type?: string } }) =>
      api.put<KnowledgeBase>(`/knowledge-bases/${id}`, data),
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

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ knowledgeBaseId, file }: { knowledgeBaseId: string; file: File }) => {
      const formData = new FormData()
      formData.append("file", file)
      return api.post(`/knowledge-bases/${knowledgeBaseId}/documents`, formData)
    },
    onSuccess: (_, { knowledgeBaseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.detail(knowledgeBaseId) })
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.documents(knowledgeBaseId) })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ knowledgeBaseId, documentId }: { knowledgeBaseId: string; documentId: string }) =>
      api.delete(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`),
    onSuccess: (_, { knowledgeBaseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.detail(knowledgeBaseId) })
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.documents(knowledgeBaseId) })
    },
  })
}
