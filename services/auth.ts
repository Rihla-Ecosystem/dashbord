import { axiosInstance } from "./axios";
import type {
  ApiLoginResponse,
  ApiRegisterResponse,
  ApiUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from "@/types";
import { normalizeBadge, normalizeUser } from "./transformers";

function toUpdateProfileInput(data: Partial<UpdateProfileRequest>) {
  return {
    display_name: data.name,
    bio: data.bio,
    nationality: data.nationality,
    language: data.languages,
    travel_style: data.travelStyle,
    budget_level: data.budget,
    accommodation_type: data.accommodation,
    arrival_date: data.arrival,
    departure_date: data.departure,
  };
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await axiosInstance.post<ApiLoginResponse>("/auth/login", data);
    return {
      accessToken: response.data.accessToken,
      user: normalizeUser(response.data.user),
    };
  },

  register: (data: RegisterRequest) =>
    axiosInstance.post<ApiRegisterResponse>("/auth/register", {
      email: data.email,
      password: data.password,
      display_name: data.name,
      gender: data.gender,
      nationality: data.nationality,
      language: data.language,
      budget_level: data.budgetLevel,
      arrival_date: data.arrivalDate,
      departure_date: data.departureDate,
      travel_style: data.travelStyle,
      interests: data.interests,
      accommodation_type: data.accommodationType,
    }).then((response) => response.data),

  logout: () => axiosInstance.post("/auth/logout"),

  logoutAll: () => axiosInstance.post("/auth/logout-all"),

  refresh: () => axiosInstance.post<{ accessToken: string }>("/auth/refresh"),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosInstance.post<{ message: string }>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosInstance.post<{ message: string }>("/auth/reset-password", {
      token: data.token,
      new_password: data.password,
    }),

  verifyEmail: (token: string) =>
    axiosInstance.get<{ message: string }>(`/auth/verify-email?token=${token}`),
};

export const usersApi = {
  getMe: async () => {
    const { data } = await axiosInstance.get<ApiUser>("/users/me");
    return normalizeUser(data);
  },

  updateMe: async (data: Partial<UpdateProfileRequest>) => {
    const { data: response } = await axiosInstance.patch<ApiUser>("/users/me", toUpdateProfileInput(data));
    return normalizeUser(response);
  },

  deleteMe: () => axiosInstance.delete("/users/me"),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosInstance.post<ApiUser>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((response) => normalizeUser(response.data));
  },

  deleteAvatar: async () => {
    const { data } = await axiosInstance.delete<ApiUser>("/users/me/avatar");
    return normalizeUser(data);
  },

  getBadges: async (userId: string) => {
    const { data } = await axiosInstance.get(`/users/${userId}/badges`);
    return Array.isArray(data) ? data.map((item) => normalizeBadge(item as Record<string, unknown>)) : [];
  },
};
