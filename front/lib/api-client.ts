import { PaginatedRequest } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  tags?: string[];
  revalidate?: number;
  headers?: Record<string, string>;
  params?: PaginatedRequest;
};


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

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to refresh token');
    const data = await response.json();
    const newToken = data.accessToken;
    localStorage.setItem('accessToken', newToken);
    return newToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}


async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let tenantId = localStorage.getItem("tenantId") ?? "";
  const makeRequest = (token: string,) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });
  let token = localStorage.getItem("accessToken") ?? "";

  let response = await makeRequest(token);

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      window.location.href = "/login";
      return response;
    }
    response = await makeRequest(newToken);
  }
  return response;
}



export async function apiClient<T>(endpoint: string, options: RequestOptions = {}, headers?: Record<string, string>, params?: PaginatedRequest): Promise<T> {
  const url = (() => {
    if (!params) return `${API_BASE_URL}${endpoint}`;
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return query ? `${API_BASE_URL}${endpoint}?${query}` : `${API_BASE_URL}${endpoint}`;
  })();


  const { method = "GET", body, tags, revalidate } = options;
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await customFetch(url, fetchOptions);
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(response.status, errorData.code ?? "UNKNOWN_ERROR", errorData.message ?? "An error occurred", errorData.errors);
  }
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const api = {
  get: <T>(url: string, opts?: Omit<RequestOptions, "method" | "body">, params?: PaginatedRequest) =>
    apiClient<T>(url, { ...opts, method: "GET" }, undefined, params),
  post: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    apiClient<T>(url, { method: "POST", body, headers }),
  put: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PUT", body }),
  patch: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: "PATCH", body }),
  delete: <T>(url: string) =>
    apiClient<T>(url, { method: "DELETE" }),
};

