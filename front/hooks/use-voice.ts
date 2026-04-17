import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Voice } from "../lib/types"

// ============================================
// Voice Services
// ============================================

export const useVoices = (provider?: string) => {
  return useQuery({
    queryKey: queryKey.Voices.all(provider),
    queryFn: () => api.get("/voices", { provider }),
  })
}

export const useElevenLabsVoices = () => {
  return useQuery({
    queryKey: queryKey.Voices.elevenLabs(),
    queryFn: () => api.get("/voices/elevenlabs"),
  })
}

export const useStreamElementsVoices = () => {
  return useQuery({
    queryKey: queryKey.Voices.streamElements(),
    queryFn: () => api.get("/voices/streamelements"),
  })
}

export const useSmallestAIVoices = () => {
  return useQuery({
    queryKey: queryKey.Voices.smallestAI(),
    queryFn: () => api.get("/voices/smallest-ai"),
  })
}

export const useVoice = (id: string) => {
  return useQuery({
    queryKey: queryKey.Voices.detail(id),
    queryFn: () => api.get(`/voices/${id}`),
    enabled: !!id,
  })
}

export const useCloneVoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; audioFile: File }) => {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("audioFile", data.audioFile)
      return api.post("/voices/clone", formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Voices.all() })
    },
  })
}

export const useDeleteVoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/voices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Voices.all() })
    },
  })
}
