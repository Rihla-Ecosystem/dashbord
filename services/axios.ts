import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, TOKEN_KEYS } from "@/constants";
import type { ApiError, AuthTokens } from "@/types";

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
}> = [];

// المسارات العامة اللي المستخدم مش محتاج يكون مسجل دخول عشان يشوفها
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(): boolean {
  if (typeof window === "undefined") return false;
  return PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path));
}

function redirectToLogin(): void {
  // منع الـ reload لو إحنا أصلاً في صفحة عامة (بيمنع الـ infinite reload loop)
  if (typeof window !== "undefined" && !isPublicPath()) {
    window.location.href = "/login";
  }
}

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (reason: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onTokenRefreshFailed(error: unknown) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get(TOKEN_KEYS.ACCESS);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!Cookies.get(TOKEN_KEYS.ACCESS)) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${API_BASE_URL}/auth/refresh`,
          undefined,
          { withCredentials: true }
        );
        setTokens({ accessToken: data.accessToken, refreshToken: "" });
        onTokenRefreshed(data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        onTokenRefreshFailed(refreshError);
        clearTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      message:
        (error.response?.data as { error?: string } | undefined)?.error ??
        error.response?.data?.message ??
        error.message ??
        "An unexpected error occurred",
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

export function setTokens(tokens: AuthTokens): void {
  Cookies.set(TOKEN_KEYS.ACCESS, tokens.accessToken, { expires: 1 });
  if (tokens.refreshToken) {
    Cookies.set(TOKEN_KEYS.REFRESH, tokens.refreshToken, { expires: 7 });
  }
}

export function clearTokens(): void {
  Cookies.remove(TOKEN_KEYS.ACCESS);
  Cookies.remove(TOKEN_KEYS.REFRESH);
}

export function getAccessToken(): string | undefined {
  return Cookies.get(TOKEN_KEYS.ACCESS);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}