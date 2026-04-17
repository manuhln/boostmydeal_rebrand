import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { KnowledgeBase, KnowledgeDocument } from "../lib/types"

// ============================================
// Knowledge Base Services
// ============================================

export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.all(),
    queryFn: () => api.get("/knowledge-bases"),
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.detail(id),
    queryFn: () => api.get(`/knowledge-bases/${id}`),
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post("/knowledge-bases", data),
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

export const useProcessKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (knowledgeBaseId: string) =>
      api.post(`/knowledge-bases/${knowledgeBaseId}/process`),
    onSuccess: (_, knowledgeBaseId) => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.detail(knowledgeBaseId) })
    },
  })
}
