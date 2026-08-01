import { axiosInstance } from "./axios";
import type { DashboardUserFilters } from "@/types";
import { buildQueryString } from "@/utils";
import {
  normalizeAuditLogsResponse,
  normalizeBadge,
  normalizeEnvironmentResponse,
  normalizeGeoPlaces,
  normalizePaginatedUsers,
  normalizeSeriesResponse,
  normalizeUser,
} from "./transformers";

export const dashboardApi = {
  getUsers: async (params?: DashboardUserFilters) => {
    const { data } = await axiosInstance.get(`/dashboard/users${buildQueryString(params ?? {})}`);
    return normalizePaginatedUsers(data as Record<string, unknown>);
  },

  updateUserRole: async (id: string, roleId: number) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/role`, { role_id: roleId });
    return data;
  },

  banUser: async (id: string, banned: boolean) => {
    const path = banned ? `/dashboard/users/${id}/ban` : `/dashboard/users/${id}/unban`;
    const { data } = await axiosInstance.patch(path);
    return data;
  },

  activateUser: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/activate`);
    return data;
  },

  deactivateUser: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/deactivate`);
    return data;
  },

  verifyUserEmail: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/verify-email`);
    return data;
  },

  resetUserXp: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/reset-xp`);
    return data;
  },

  resetUserWallet: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/reset-wallet`);
    return data;
  },

  restoreUser: async (id: string) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/restore`);
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await axiosInstance.delete(`/dashboard/users/${id}`);
    return data;
  },

  getUser: async (id: string) => {
    const { data } = await axiosInstance.get(`/dashboard/users/${id}`);
    return normalizeUser(data as Record<string, unknown>);
  },

  getUserStatistics: async (id: string) => {
    const { data } = await axiosInstance.get(`/dashboard/users/${id}/statistics`);
    return data as Record<string, unknown>;
  },

  getStatistics: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/statistics`);
    return data as Record<string, unknown>;
  },

  getTopUsers: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/top`);
    return data as Record<string, unknown>;
  },

  getRecentActivity: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/recent-activity${buildQueryString(params ?? {})}`);
    return normalizeAuditLogsResponse(data);
  },

  getGrowth: async (params?: { range?: string }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/growth${buildQueryString(params ?? {})}`);
    return normalizeSeriesResponse(data);
  },

  getRevenue: async (params?: { range?: string }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/revenue${buildQueryString(params ?? {})}`);
    return normalizeSeriesResponse(data);
  },

  getCountries: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/countries`);
    return normalizeSeriesResponse(data);
  },

  getLanguages: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/languages`);
    return normalizeSeriesResponse(data);
  },

  getRetention: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/retention`);
    return data as Record<string, unknown>;
  },

  getAdminTimeline: async (params?: { page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/admin-timeline${buildQueryString(params ?? {})}`);
    return normalizeAuditLogsResponse(data);
  },

  searchUsers: async (search: string) => {
    const { data } = await axiosInstance.get(`/dashboard/users/search${buildQueryString({ search })}`);
    return normalizePaginatedUsers(data as Record<string, unknown>);
  },

  exportUsers: async (params: { ids?: string[]; format?: "csv" | "excel" } = {}) => {
    const { data } = await axiosInstance.post(`/dashboard/users/bulk/export`, params, {
      responseType: "blob",
    });
    return data as Blob;
  },

  getUserBadges: async (id: string) => {
    const { data } = await axiosInstance.get(`/users/${id}/badges`);
    return Array.isArray(data) ? data.map((item) => normalizeBadge(item as Record<string, unknown>)) : [];
  },

  getEnvironment: async (params: { lat: number; lon: number }) => {
    const { data } = await axiosInstance.get(`/env${buildQueryString(params)}`);
    return normalizeEnvironmentResponse(data);
  },

  getGeoSearch: async (params: { q: string; lat?: number; lon?: number; radius?: number; categories?: string }) => {
    const { data } = await axiosInstance.get(`/geo/search${buildQueryString(params)}`);
    return normalizeGeoPlaces(data);
  },

  getGeoPois: async (params: { lat: number; lon: number; radius?: number; categories?: string }) => {
    const { data } = await axiosInstance.get(`/geo/pois${buildQueryString(params)}`);
    return normalizeGeoPlaces(data);
  },
};