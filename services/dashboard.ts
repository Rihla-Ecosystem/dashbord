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

function extractSeriesByRange(data: unknown, range?: string): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const record = data as Record<string, unknown>;
  const aliases: Record<string, string[]> = {
    daily: ["daily", "revenueByDay"],
    weekly: ["weekly", "revenueByWeek"],
    monthly: ["monthly", "revenueByMonth"],
    yearly: ["yearly", "revenueByYear"],
  };
  const candidates = aliases[range ?? "monthly"] ?? aliases.monthly;
  for (const key of candidates) {
    if (Array.isArray(record[key])) return record[key];
  }
  for (const key of Object.keys(aliases)) {
    for (const candidate of aliases[key]) {
      if (Array.isArray(record[candidate])) return record[candidate];
    }
  }
  return data;
}

function mapUserFilters(params: DashboardUserFilters): Record<string, unknown> {
  const { sortBy, sortOrder, from, to, minXp, maxXp, ...rest } = params;
  const mapped: Record<string, unknown> = { ...rest };
  if (sortBy) mapped.sort = sortBy;
  if (sortOrder) mapped.order = sortOrder;
  if (from) mapped.createdFrom = from;
  if (to) mapped.createdTo = to;
  if (minXp !== undefined) mapped.minXP = minXp;
  if (maxXp !== undefined) mapped.maxXP = maxXp;
  return mapped;
}

export const dashboardApi = {
  getUsers: async (params?: DashboardUserFilters) => {
    const query = buildQueryString(mapUserFilters(params ?? {}));
    const { data } = await axiosInstance.get(`/dashboard/users${query}`);
    const envelope = (data ?? {}) as Record<string, unknown>;
    const payload = (envelope.data ?? {}) as Record<string, unknown>;
    const rows = Array.isArray(payload.users) ? (payload.users as unknown[]) : [];
    const pagination = (payload.pagination ?? {}) as Record<string, unknown>;
    return normalizePaginatedUsers({
      data: rows,
      total: typeof pagination.total === "number" ? pagination.total : rows.length,
      page: typeof pagination.page === "number" ? pagination.page : 1,
      limit: typeof pagination.limit === "number" ? pagination.limit : rows.length || 1,
      totalPages: typeof pagination.totalPages === "number" ? pagination.totalPages : 1,
    });
  },

  updateUserRole: async (id: string, roleId: number) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}/role`, { role_id: roleId });
    return data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    gender: 'MALE' | 'FEMALE';
    nationality: string;
    language?: string[];
    budgetLevel?: string;
    arrivalDate?: string;
    departureDate?: string;
    travelStyle?: string;
    interests?: string[];
    accommodationType?: string;
    roleId?: number;
  }) => {
    const { data } = await axiosInstance.post('/dashboard/users', userData);
    return data;
  },

  updateUser: async (id: string, updateData: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    gender?: 'MALE' | 'FEMALE';
    nationality?: string;
    language?: string[];
    budgetLevel?: string;
    arrivalDate?: string;
    departureDate?: string;
    travelStyle?: string;
    interests?: string[];
    accommodationType?: string;
    roleId?: number;
    isActive?: boolean;
    isEmailVerified?: boolean;
    isBanned?: boolean;
    xp?: number;
    level?: number;
  }) => {
    const { data } = await axiosInstance.patch(`/dashboard/users/${id}`, updateData);
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
    const envelope = (data ?? {}) as { data?: unknown };
    const record = (envelope.data ?? {}) as Record<string, unknown>;
    const basic = (record.basicInformation ?? record) as Record<string, unknown>;
    const roleRecord = (record.role ?? null) as { name?: string } | null;
    return normalizeUser({
      ...basic,
      role: roleRecord?.name,
      xp: record.xp,
      level: record.level,
      createdAt: basic.createdAt ?? record.createdAt,
    });
  },

  // get roles
  getRoles: async () => {
    const { data } = await axiosInstance.get(`/users/roles`);
    const envelope = (data ?? {}) as { data?: unknown };
    const roles = Array.isArray(envelope.data) ? (envelope.data as Array<Record<string, unknown>>) : [];
    return roles.map((role ) => ({
      id : role.id,
      name: role.name,
    }));
  } ,

  getUserStatistics: async (id: string) => {
    const { data } = await axiosInstance.get(`/dashboard/users/${id}/statistics`);
    const envelope = (data ?? {}) as { data?: unknown };
    return (envelope.data ?? {}) as Record<string, unknown>;
  },

  getStatistics: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/statistics`);
    const envelope = (data ?? {}) as { data?: unknown };
    return (envelope.data ?? {}) as Record<string, unknown>;
  },

  getTopUsers: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/top`);
    const envelope = (data ?? {}) as { data?: unknown };
    return (envelope.data ?? {}) as Record<string, unknown>;
  },

  getRecentBadgeUnlocks: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/recent-activity`);
    const envelope = (data ?? {}) as { data?: unknown };
    const activity = (envelope.data ?? {}) as Record<string, unknown>;
    const unlocks = Array.isArray(activity.recentBadgeUnlocks)
      ? (activity.recentBadgeUnlocks as Array<Record<string, unknown>>)
      : [];
    return unlocks.map((unlock) => ({
      id: unlock.id,
      awardedAt: unlock.awardedAt,
      user: (unlock.user ?? {}) as Record<string, unknown>,
      badge: normalizeBadge(((unlock.badge ?? {}) as Record<string, unknown>)),
    }));
  },

  getGrowth: async (params?: { range?: string }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/growth`);
    const envelope = (data ?? {}) as { data?: unknown };
    return normalizeSeriesResponse(extractSeriesByRange(envelope.data, params?.range));
  },

  getRevenue: async (params?: { range?: string }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/revenue`);
    const envelope = (data ?? {}) as { data?: unknown };
    return normalizeSeriesResponse(extractSeriesByRange(envelope.data, params?.range));
  },

  getCountries: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/countries`);
    const envelope = (data ?? {}) as { data?: unknown };
    return normalizeSeriesResponse(envelope.data);
  },

  getLanguages: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/languages`);
    const envelope = (data ?? {}) as { data?: unknown };
    return normalizeSeriesResponse(envelope.data);
  },

  getRetention: async () => {
    const { data } = await axiosInstance.get(`/dashboard/users/analytics/retention`);
    const envelope = (data ?? {}) as { data?: unknown };
    return (envelope.data ?? {}) as Record<string, unknown>;
  },

  getAdminTimeline: async (params?: { page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/dashboard/users/admin-timeline`);
    const envelope = (data ?? {}) as { data?: unknown };
    const grouped = (envelope.data ?? {}) as Record<string, unknown>;
    const entries = Object.values(grouped)
      .filter((value) => Array.isArray(value))
      .flatMap((value) => value as unknown[])
      .sort((a, b) => {
        const ta = (a as Record<string, unknown>).createdAt;
        const tb = (b as Record<string, unknown>).createdAt;
        return typeof ta === "string" && typeof tb === "string" ? (ta < tb ? 1 : ta > tb ? -1 : 0) : 0;
      });
    const limit = params?.limit ?? (entries.length || 1);
    const page = params?.page ?? 1;
    const sliced = entries.slice((page - 1) * limit, page * limit);
    return normalizeAuditLogsResponse({
      data: sliced,
      total: entries.length,
      page,
      limit,
      totalPages: Math.ceil(entries.length / limit),
    });
  },

  exportUsers: async (
    params: DashboardUserFilters = {},
    format: "csv" | "excel" = "csv"
  ) => {
    const { data, headers } = await axiosInstance.get(`/dashboard/users/export`, {
      params: { ...mapUserFilters(params), format },
      responseType: "blob",
    });
    const disposition = (headers?.["content-disposition"] ?? "") as string;
    const match = /filename="?([^";]+)"?/.exec(disposition);
    return { blob: data as Blob, filename: match?.[1] ?? `users.${format === "excel" ? "xlsx" : "csv"}` };
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