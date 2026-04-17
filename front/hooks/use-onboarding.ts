import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { OnboardingData } from "../lib/types"

// ============================================
// Onboarding Hooks
// ============================================

export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: queryKey.onboarding.status(),
    queryFn: () => api.get("/onboarding/status"),
  })
}

export const useSaveOnboardingStep = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ step, data }: { step: number; data: Partial<OnboardingData> }) =>
      api.post(`/onboarding/step/${step}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.onboarding.status() })
    },
  })
}

export const useSkipOnboarding = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post("/onboarding/skip"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.onboarding.status() })
    },
  })
}

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post("/onboarding/complete"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.onboarding.status() })
    },
  })
}





