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

export const adminApi = {
  getUsers: (params?: UsersQueryParams) =>
    axiosInstance.get<PaginatedResponse<User>>(
      `/admin/users${buildQueryString(params ?? {})}`
    ),

  updateUserRole: (id: string, role: UserRole) =>
    axiosInstance.patch<User>(`/admin/users/${id}/role`, { role }),

  banUser: (id: string, banned: boolean, reason?: string) =>
    axiosInstance.patch<User>(`/admin/users/${id}/ban`, { banned, reason }),

  getAuditLogs: (params?: AuditLogsQueryParams) =>
    axiosInstance.get<PaginatedResponse<AuditLog>>(
      `/admin/audit-logs${buildQueryString(params ?? {})}`
    ),
};
