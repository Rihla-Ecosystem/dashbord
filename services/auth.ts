import { axiosInstance } from "./axios";
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from "@/types";

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>("/auth/register", data),

  logout: () => axiosInstance.post("/auth/logout"),

  logoutAll: () => axiosInstance.post("/auth/logout-all"),

  refresh: (refreshToken: string) =>
    axiosInstance.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken }
    ),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosInstance.post<{ message: string }>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosInstance.post<{ message: string }>("/auth/reset-password", data),

  verifyEmail: (token: string) =>
    axiosInstance.get<{ message: string }>(`/auth/verify-email?token=${token}`),
};

export const usersApi = {
  getMe: () => axiosInstance.get<User>("/users/me"),

  updateMe: (data: Partial<User>) =>
    axiosInstance.patch<User>("/users/me", data),

  deleteMe: () => axiosInstance.delete("/users/me"),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosInstance.post<User>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteAvatar: () => axiosInstance.delete<User>("/users/me/avatar"),

  getBadges: (userId: string) =>
    axiosInstance.get(`/users/${userId}/badges`),
};
