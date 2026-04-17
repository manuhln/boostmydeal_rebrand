import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { PhoneNumber } from "../lib/types"

// ============================================
// Phone Number Services
// ============================================

export const usePhoneNumbers = () => {
  return useQuery({
    queryKey: queryKey.PhoneNumbers.all(),
    queryFn: () => api.get("/phone-numbers"),
  })
}

export const usePhoneNumber = (id: string) => {
  return useQuery({
    queryKey: queryKey.PhoneNumbers.detail(id),
    queryFn: () => api.get(`/phone-numbers/${id}`),
    enabled: !!id,
  })
}

export const useAddPhoneNumber = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { number: string; label?: string }) =>
      api.post("/phone-numbers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.PhoneNumbers.all() })
    },
  })
}

export const useDeletePhoneNumber = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/phone-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.PhoneNumbers.all() })
    },
  })
}
