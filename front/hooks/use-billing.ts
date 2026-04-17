import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { BillingInfo } from "../lib/types"

// ============================================
// Billing Services
// ============================================

export const useBillingInfo = () => {
  return useQuery({
    queryKey: queryKey.Billing.info(),
    queryFn: () => api.get("/billing/info"),
  })
}

export const usePaymentHistory = () => {
  return useQuery({
    queryKey: queryKey.Billing.paymentHistory(),
    queryFn: () => api.get("/billing/history"),
  })
}

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: (amount: number) => api.post("/billing/create-payment-intent", { amount }),
  })
}
