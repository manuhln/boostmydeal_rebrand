import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { Credits, Payment, PaymentIntent, CreatePaymentIntentRequest } from "../lib/types"

export const useCredits = () => {
  return useQuery({
    queryKey: queryKey.Billing.credits(),
    queryFn: () => api.get<Credits>("/credits"),
  })
}

export const usePaymentHistory = (params?: { status?: string; per_page?: number }) => {
  return useQuery({
    queryKey: queryKey.Billing.payments(),
    queryFn: () => api.get<{ data: Payment[] }>("/payments", params),
  })
}

export const usePayment = (paymentId: string) => {
  return useQuery({
    queryKey: queryKey.Billing.payment(paymentId),
    queryFn: () => api.get<Payment>(`/payments/${paymentId}`),
    enabled: !!paymentId,
  })
}

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentIntentRequest) =>
      api.post<PaymentIntent>("/payments/create-intent", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Billing.credits() })
      queryClient.invalidateQueries({ queryKey: queryKey.Billing.payments() })
    },
  })
}
