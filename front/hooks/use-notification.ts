import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Notification } from "../lib/types"

export const useNotifications = (params?: {
  "filter[read]"?: boolean
  "filter[notification_type]"?: string
  sort?: string
  page?: number
  per_page?: number
}) => {
  return useQuery({
    queryKey: queryKey.Notifications.all(params?.page || 1),
    queryFn: () => api.get<{ data: Notification[] }>("/notifications", params),
  })
}

export const useNotification = (id: string) => {
  return useQuery({
    queryKey: queryKey.Notifications.detail(id),
    queryFn: () => api.get<Notification>(`/notifications/${id}`),
    enabled: !!id,
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post<{ message: string }>(`/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Notifications.all(1) })
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ message: string }>("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Notifications.all(1) })
    },
  })
}
