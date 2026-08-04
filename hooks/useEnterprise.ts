"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { enterpriseApi, assistantApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import type { AdminAssistantResponse } from "@/types";

export function useEnterpriseOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseOverview,
    queryFn: () => enterpriseApi.getOverview(),
  });
}

export function useEnterpriseSystemHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseSystemHealth,
    queryFn: () => enterpriseApi.getSystemHealth(),
    refetchInterval: 30_000,
  });
}

export function useEnterpriseEntityStats() {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseEntityStats,
    queryFn: () => enterpriseApi.getEntityStatistics(),
  });
}

export function useApiMonitoringSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseApiMonitoringSummary,
    queryFn: () => enterpriseApi.getApiMonitoringSummary(),
    refetchInterval: 30_000,
  });
}

export function useApiMonitoring(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseApiMonitoring(params),
    queryFn: () => enterpriseApi.getApiMonitoring(params),
  });
}

export function useAiUsage() {
  return useQuery({
    queryKey: QUERY_KEYS.enterpriseAiUsage,
    queryFn: () => enterpriseApi.getAiUsage(),
  });
}

export function useAdminAssistant() {
  return useMutation({
    mutationFn: (question: string) => assistantApi.ask(question),
    onError: () => {},
  });
}

export type { AdminAssistantResponse };
