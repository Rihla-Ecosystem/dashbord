import { axiosInstance } from "./axios";
import type {
  AuditLog,
  AuditLogsQueryParams,
  PaginatedResponse,
  User,
  UserRole,
  UsersQueryParams,
} from "@/types";
import { buildQueryString } from "@/utils";
import { normalizeAuditLog } from "./transformers";

export const adminApi = {
  getUsers: (params?: UsersQueryParams) =>
    axiosInstance.get<PaginatedResponse<User>>(
      `/admin/users${buildQueryString(params ?? {})}`
    ),

  updateUserRole: (id: string, role: UserRole) =>
    axiosInstance.patch<User>(`/admin/users/${id}/role`, { role }),

  banUser: (id: string, banned: boolean, reason?: string) =>
    axiosInstance.patch<User>(`/admin/users/${id}/ban`, { banned, reason }),

  getAuditLogs: async (params?: AuditLogsQueryParams) => {
    const { data } = await axiosInstance.get<{ logs?: unknown; pagination?: unknown }>(
      `/admin/audit-logs${buildQueryString(params ?? {})}`
    );
    const logs = Array.isArray(data?.logs) ? (data.logs as unknown[]) : [];
    const pagination = (data?.pagination ?? {}) as Record<string, unknown>;
    return {
      data: logs.map((item) => normalizeAuditLog(item)),
      total: typeof pagination.total === "number" ? pagination.total : logs.length,
      page: typeof pagination.page === "number" ? pagination.page : 1,
      limit: typeof pagination.limit === "number" ? pagination.limit : logs.length || 1,
      totalPages: typeof pagination.totalPages === "number" ? pagination.totalPages : 1,
    } as PaginatedResponse<AuditLog>;
  },
};
