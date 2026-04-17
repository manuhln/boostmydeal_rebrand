import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { AuthResponse, User, Organization, LoginResponse } from "../lib/types"

// ============================================
// Authentication Services
// ============================================

export const useMe = () => {
  return useQuery({
    queryKey: queryKey.auth.me(),
    queryFn: () => api.get("/me"),
  })
}


export const useLogin = () => {
  return useMutation({
    mutationFn: (tenantId: string) =>
      api.post<LoginResponse>("/login", undefined, {
        "X-Tenant-ID": tenantId,
      }),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("tenentId", data.tenant.id);
    },
  })
}


export const useSignup = () => {
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      email: string;
      password: string;
      first_Name: string;
      last_Name: string;
      phone?: string;
      website?: string;
    }) => api.post("/signup", data),
  })
}



export const useSendOtp = () => {
  return useMutation({
    mutationFn: (email: string) => api.post("/tenants/signup.checkEmail", { email }),
  })
}

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      api.post("tenants/signup.verifyOtp", data),
  })
}


export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post("/logout"),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

