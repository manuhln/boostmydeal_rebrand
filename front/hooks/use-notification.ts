import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Notification, NotificationApiItem } from "../lib/types"

export const useNotifications = (params?: {
  "filter[read]"?: boolean
  "filter[notification_type]"?: string
  sort?: string
  page?: number
  per_page?: number
}) => {
  return useQuery({
    queryKey: queryKey.Notifications.all(params?.page ?? 1),
    queryFn: () =>
      api.get<{ data: NotificationApiItem[]; meta?: unknown; links?: unknown }>(
        "/notifications",
        params,
      ),
    select: (res) => ({
      ...res,
      data: res.data.map((item): Notification => ({ id: item.id, ...item.attributes })),
    }),
  })
}

export const useNotification = (id: string) => {
  return useQuery({
    queryKey: queryKey.Notifications.detail(id),
    queryFn: () => api.get<{ data: NotificationApiItem }>(`/notifications/${id}`),
    select: (res): Notification => ({ id: res.data.id, ...res.data.attributes }),
    enabled: !!id,
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post<{ message: string }>(`/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ message: string }>("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}
