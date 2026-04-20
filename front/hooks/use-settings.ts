import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { User, Organization, UserPreferences } from "../lib/types"

// ============================================
// Settings Services
// ============================================

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<User>) => api.patch("/settings/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.auth.me() })
      queryClient.invalidateQueries({ queryKey: queryKey.Settings.profile() })
    },
  })
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Organization>) => api.patch("/settings/organization", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.auth.me() })
      queryClient.invalidateQueries({ queryKey: queryKey.Settings.organization() })
    },
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch("/settings/change-password", data),
  })
}

export const useGetPreferences = () => {
  return useQuery({
    queryKey: queryKey.Preferences.get(),
    queryFn: () => api.get<UserPreferences>("/preferences"),
  })
}

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) =>
      api.put<{ message: string; preferences: UserPreferences }>("/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Preferences.get() })
    },
  })
}
