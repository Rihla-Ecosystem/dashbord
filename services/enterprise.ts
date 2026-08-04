import { axiosInstance } from "./axios";
import { buildQueryString } from "@/utils";
import type {
  AiUsageSummary,
  ApiMonitoringLogEntry,
  ApiMonitoringSummary,
  EntityStatistics,
  PlatformOverview,
  SystemHealth,
} from "@/types";

function unwrapEnvelope<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    const record = envelope as Record<string, unknown>;
    if (record.success && "data" in record) return record.data as T;
  }
  return envelope as T;
}

export const enterpriseApi = {
  getOverview: async (): Promise<PlatformOverview> => {
    const { data } = await axiosInstance.get(`/admin/enterprise/overview`);
    return unwrapEnvelope<PlatformOverview>(data);
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const { data } = await axiosInstance.get(`/admin/enterprise/system-health`);
    return unwrapEnvelope<SystemHealth>(data);
  },

  getEntityStatistics: async (): Promise<EntityStatistics> => {
    const { data } = await axiosInstance.get(`/admin/enterprise/entity-statistics`);
    return unwrapEnvelope<EntityStatistics>(data);
  },

  getApiMonitoringSummary: async (): Promise<ApiMonitoringSummary> => {
    const { data } = await axiosInstance.get(`/admin/enterprise/api-monitoring/summary`);
    return unwrapEnvelope<ApiMonitoringSummary>(data);
  },

  getApiMonitoring: async (params?: { page?: number; limit?: number }): Promise<{
    logs: ApiMonitoringLogEntry[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const { data } = await axiosInstance.get(`/admin/enterprise/api-monitoring${buildQueryString(params ?? {})}`);
    return unwrapEnvelope<{
      logs: ApiMonitoringLogEntry[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(data);
  },

  getAiUsage: async (): Promise<AiUsageSummary> => {
    const { data } = await axiosInstance.get(`/admin/ai-usage`);
    return unwrapEnvelope<AiUsageSummary>(data);
  },
};
