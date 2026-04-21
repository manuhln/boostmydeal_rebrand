import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { KnowledgeBase, KnowledgeBaseApiItem, KnowledgeBasePayload } from "../lib/types"

export const useKnowledgeBases = (params?: {
  "filter[name]"?: string
  sort?: string
}) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.all(),
    queryFn: () =>
      api.get<{ data: KnowledgeBaseApiItem[]; meta?: unknown; links?: unknown }>(
        "/knowledge-bases",
        { ...params, include: "agents" }
      ),
    select: (res) => ({
      ...res,
      data: res.data.map((item): KnowledgeBase => ({
        id: item.id,
        ...item.attributes,
        agents_count: item.relationships?.agents?.data?.length ?? 0,
      })),
    }),
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: queryKey.KnowlegeBase.detail(id),
    queryFn: () => api.get<{ data: KnowledgeBaseApiItem }>(`/knowledge-bases/${id}`),
    select: (res) => ({
      id: res.data.id,
      ...res.data.attributes,
      agents_count: res.data.relationships?.agents?.data?.length ?? 0,
    }) as KnowledgeBase,
    enabled: !!id,
  })
}

const buildCreateFormData = (data: KnowledgeBasePayload): FormData => {
  const fd = new FormData()
  fd.append("name", data.name)
  if (data.description) fd.append("description", data.description)
  if (data.file) fd.append("file", data.file)
  return fd
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: KnowledgeBasePayload) =>
      api.post("/knowledge-bases", buildCreateFormData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.KnowlegeBase.all() })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeBasePayload> }) => {
      const fd = new FormData()
      fd.append("_method", "PUT")
      if (data.name) fd.append("name", data.name)
      if (data.description !== undefined) fd.append("description", data.description ?? "")
      if (data.file) fd.append("file", data.file)
      return api.post(`/knowledge-bases/${id}`, fd)
    },
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
