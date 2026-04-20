import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { LoginResponse, VerifyOtpResponse, SignupResponse } from "../lib/types"


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
    onSuccess: (response) => {
      localStorage.setItem("accessToken", response?.data.accessToken);
      localStorage.setItem("tenantId", response?.data.tenant.data.id);

    },
  })
}

export const useSignup = () => {
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      email: string;
      first_name: string;
      last_name: string;
      phone?: string;
      website?: string;
    }) => api.post<SignupResponse>("/tenants/register", data)
  })
}
export const useSendOtp = () => {
  return useMutation({
    mutationFn: (email: string) =>
      api.post("/tenants/signup.checkEmail", { email })
  })
}

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      api.post<VerifyOtpResponse>("/tenants/signup.verifyOtp", data),
  })
}


export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post("/logout"),
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tenantId");
      window.location.href = "/login";
    },
  })
}
