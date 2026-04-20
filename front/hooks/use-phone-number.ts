import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { PhoneNumber, PhoneNumberApiItem, AddPhoneNumberPayload } from "../lib/types"

export const usePhoneNumbers = (params?: {
  "filter[did]"?: string
  "filter[provider]"?: "voxsun" | "twilio"
  "filter[country_code]"?: string
  sort?: string
}) => {
  return useQuery({
    queryKey: queryKey.PhoneNumbers.all(),
    queryFn: () => api.get<{ data: PhoneNumberApiItem[]; meta?: unknown; links?: unknown }>("/phone-numbers", params),
    select: (res) => ({
      ...res,
      data: res.data.map((item): PhoneNumber => ({ id: item.id, ...item.attributes })),
    }),
  })
}

export const usePhoneNumber = (id: string) => {
  return useQuery({
    queryKey: queryKey.PhoneNumbers.detail(id),
    queryFn: () => api.get<{ data: PhoneNumberApiItem }>(`/phone-numbers/${id}`),
    select: (res) => ({ id: res.data.id, ...res.data.attributes }) as PhoneNumber,
    enabled: !!id,
  })
}

export const useAddPhoneNumber = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddPhoneNumberPayload) => api.post("/phone-numbers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.PhoneNumbers.all() })
    },
  })
}

export const useUpdatePhoneNumber = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddPhoneNumberPayload> }) =>
      api.put(`/phone-numbers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.PhoneNumbers.all() })
      queryClient.invalidateQueries({ queryKey: queryKey.PhoneNumbers.detail(id) })
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
