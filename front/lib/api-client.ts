import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { PaginatedRequest } from "./types";
import { queryClient } from "./query-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const APP_BASE_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function hasCookie(name: string): boolean {
  return document.cookie.split('; ').some(c => c.startsWith(`${name}=`));
}

let csrfPromise: Promise<unknown> | null = null;



function ensureCsrf(tenantId?: string): Promise<unknown> {

  if (hasCookie('XSRF-TOKEN') && !csrfPromise) return Promise.resolve();
  csrfPromise ??= initCsrf(tenantId).finally(() => { csrfPromise = null; });
  return csrfPromise;
}

function refreshCsrf(tenantId?: string): Promise<unknown> {
  csrfPromise = initCsrf(tenantId).finally(() => { csrfPromise = null; });
  return csrfPromise;
}


const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? '').toLowerCase();

  const noCsrfUrls = ["signup.verifyOtp", "signup.checkEmail", "register"];
  if (['post', 'put', 'patch', 'delete', 'get'].includes(method) && !noCsrfUrls.some(url => config.url?.includes(url))) {
    const tenantId = localStorage.getItem("tenantId")
      || config.headers?.["X-Tenant-ID"] as string
      || undefined;
    await ensureCsrf(tenantId);
  }

  const token = localStorage.getItem("accessToken") ?? "";
  const tenantId = localStorage.getItem("tenantId") ?? "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.headers["X-Tenant-ID"] && tenantId) {
    config.headers["X-Tenant-ID"] = tenantId;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
};


const rejectQueue = (err: unknown) => {
  refreshQueue.forEach(({ reject }) => reject(err));
  refreshQueue = [];
};



// Handle 401 — refresh token once, then replay queued requests
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };


    if (error.response?.status === 419 && !original._retry) {
      original._retry = true;

      const tenantId = localStorage.getItem("tenantId")
        || original.headers?.["X-Tenant-ID"] as string
        || undefined;
      await refreshCsrf(tenantId);
      return axiosInstance(original);
    }

    if (error.response?.status !== 401 || original._retry) {
      const data = error.response?.data as { code?: string; message?: string; errors?: Record<string, string[]> } | undefined;
      throw new ApiError(
        error.response?.status ?? 0,
        data?.code ?? "UNKNOWN_ERROR",
        data?.message ?? "An error occurred",
        data?.errors
      );
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const tenantId = localStorage.getItem("tenantId") ?? undefined;
      const refreshHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (tenantId) refreshHeaders["X-Tenant-ID"] = tenantId;


      const { data } = await axios.post(`${API_BASE_URL}/refresh-token`, {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: refreshHeaders,
      });

      const newToken: string = data.data.accessToken;
      localStorage.setItem("accessToken", newToken);
      processQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch (err) {
      rejectQueue(err);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("tenantId");
      queryClient.clear();
      window.location.href = "/login";
      throw error;
    } finally {
      isRefreshing = false;
    }
  }
);

export async function apiClient<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    params?: PaginatedRequest;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers, params } = options;

  const response = await axiosInstance.request<T>({
    url: endpoint,
    method,
    data: body,
    headers,
    params,
  });

  return response.data;
}

// Call once before the first auth request to set the XSRF-TOKEN cookie.
// Axios then automatically sends it as X-XSRF-TOKEN on every subsequent request.
export const initCsrf = (tenantId?: string) => {
  const headers: Record<string, string> = {};
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return axios.get(`${APP_BASE_URL}/api/csrf-cookie`, {
    withCredentials: true,
    headers,
  });
};

export const api = {
  get: <T>(url: string, params?: PaginatedRequest, headers?: Record<string, string>) =>
    apiClient<T>(url, { method: "GET", params, headers }),
  post: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    apiClient<T>(url, { method: "POST", body, headers }),
  put: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PUT", body }),
  patch: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PATCH", body }),
  delete: <T>(url: string) =>
    apiClient<T>(url, { method: "DELETE" }),
};
