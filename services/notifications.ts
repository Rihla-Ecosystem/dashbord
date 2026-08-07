import { axiosInstance } from "./axios";
import type {
  AdminNotificationsResult,
  ContextReportDetail,
  ContextReportsResult,
  CreateNotificationInput,
  CreateNotificationResult,
  CreateTemplateInput,
  NotificationAnalytics,
  NotificationHistoryResult,
  NotificationLogsResult,
  NotificationSettings,
  NotificationTemplate,
  NotificationTemplatesResult,
  ReadUnreadStats,
  NotificationCategories,
} from "@/types/notifications";

function unwrapEnvelope<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const record = envelope as Record<string, unknown>;
    return record.data as T;
  }
  return envelope as T;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  category?: string;
  priority?: string;
  source?: string;
  isRead?: boolean;
  userId?: string;
}

export const notificationsApi = {
  async listNotifications(query: NotificationQuery = {}): Promise<AdminNotificationsResult> {
    const { data } = await axiosInstance.get<unknown>(
      `/admin/notifications/notifications${buildQuery(query)}`
    );
    return unwrapEnvelope<AdminNotificationsResult>(data);
  },

  async createNotification(input: CreateNotificationInput): Promise<CreateNotificationResult> {
    const { data } = await axiosInstance.post<unknown>("/admin/notifications/notifications", input);
    return unwrapEnvelope<CreateNotificationResult>(data);
  },

  async listTemplates(query: { page?: number; limit?: number; search?: string } = {}): Promise<NotificationTemplatesResult> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/templates${buildQuery(query)}`);
    return unwrapEnvelope<NotificationTemplatesResult>(data);
  },

  async createTemplate(input: CreateTemplateInput): Promise<NotificationTemplate> {
    const { data } = await axiosInstance.post<unknown>("/admin/notifications/templates", input);
    return unwrapEnvelope<NotificationTemplate>(data);
  },

  async updateTemplate(id: string, patch: Record<string, unknown>): Promise<NotificationTemplate> {
    const { data } = await axiosInstance.patch<unknown>(`/admin/notifications/templates/${id}`, patch);
    return unwrapEnvelope<NotificationTemplate>(data);
  },

  async deleteTemplate(id: string): Promise<{ id: string; deleted: boolean }> {
    const { data } = await axiosInstance.delete<unknown>(`/admin/notifications/templates/${id}`);
    return unwrapEnvelope<{ id: string; deleted: boolean }>(data);
  },

  async listHistory(query: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<NotificationHistoryResult> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/history${buildQuery(query)}`);
    return unwrapEnvelope<NotificationHistoryResult>(data);
  },

  async cancelScheduled(historyId: string): Promise<NotificationHistoryResult["history"][number]> {
    const { data } = await axiosInstance.post<unknown>(`/admin/notifications/history/${historyId}/cancel`);
    return unwrapEnvelope<NotificationHistoryResult["history"][number]>(data);
  },

  async getAnalytics(): Promise<NotificationAnalytics> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/analytics`);
    return unwrapEnvelope<NotificationAnalytics>(data);
  },

  async getReadUnreadStats(): Promise<ReadUnreadStats> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/analytics/read-unread`);
    return unwrapEnvelope<ReadUnreadStats>(data);
  },

  async getDeliveryLogs(query: { page?: number; limit?: number; event?: string; userId?: string } = {}): Promise<NotificationLogsResult> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/logs${buildQuery(query)}`);
    return unwrapEnvelope<NotificationLogsResult>(data);
  },

  async listUserInbox(userId: string, query: { page?: number; limit?: number; isRead?: boolean } = {}): Promise<{ inbox: AdminNotificationsResult["notifications"]; pagination: AdminNotificationsResult["pagination"] }> {
    const { data } = await axiosInstance.get<unknown>(
      `/admin/notifications/inbox/${encodeURIComponent(userId)}${buildQuery(query)}`
    );
    return unwrapEnvelope<{ inbox: AdminNotificationsResult["notifications"]; pagination: AdminNotificationsResult["pagination"] }>(data);
  },

  async listContextReports(query: { page?: number; limit?: number; search?: string } = {}): Promise<ContextReportsResult> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/context-reports${buildQuery(query)}`);
    return unwrapEnvelope<ContextReportsResult>(data);
  },

  async getContextReport(id: string): Promise<ContextReportDetail> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/context-reports/${id}`);
    return unwrapEnvelope<ContextReportDetail>(data);
  },

  async getSettings(): Promise<NotificationSettings> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/settings`);
    return unwrapEnvelope<NotificationSettings>(data);
  },

  async updateSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const { data } = await axiosInstance.put<unknown>(`/admin/notifications/settings`, patch);
    return unwrapEnvelope<NotificationSettings>(data);
  },

  async getCategories(): Promise<NotificationCategories> {
    const { data } = await axiosInstance.get<unknown>(`/admin/notifications/categories`);
    return unwrapEnvelope<NotificationCategories>(data);
  },

  async processScheduled(): Promise<{ processed: number }> {
    const { data } = await axiosInstance.post<unknown>("/admin/notifications/process-scheduled");
    return unwrapEnvelope<{ processed: number }>(data);
  },
};