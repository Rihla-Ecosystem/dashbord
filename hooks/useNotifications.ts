"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { notificationsApi, type NotificationQuery } from "@/services/notifications";
import type { CreateNotificationInput, CreateTemplateInput } from "@/types/notifications";

export function useAdminNotifications(query: NotificationQuery = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.adminNotifications(query),
    queryFn: async () => notificationsApi.listNotifications(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useNotificationAnalytics() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationAnalytics,
    queryFn: () => notificationsApi.getAnalytics(),
  });
}

export function useReadUnreadStats() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationReadUnread,
    queryFn: () => notificationsApi.getReadUnreadStats(),
  });
}

export function useNotificationTemplates(query: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationTemplates(query),
    queryFn: () => notificationsApi.listTemplates(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useNotificationHistory(query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationHistory(query),
    queryFn: () => notificationsApi.listHistory(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useNotificationLogs(query: { page?: number; limit?: number; event?: string; userId?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationLogs(query),
    queryFn: () => notificationsApi.getDeliveryLogs(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useContextReports(query: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationContextReports(query),
    queryFn: () => notificationsApi.listContextReports(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useContextReport(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationContextReport(id ?? ""),
    queryFn: () => notificationsApi.getContextReport(id!),
    enabled: Boolean(id),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationSettings,
    queryFn: () => notificationsApi.getSettings(),
  });
}

export function useNotificationCategories() {
  return useQuery({
    queryKey: ["notification-categories"] as const,
    queryFn: () => notificationsApi.getCategories(),
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof notificationsApi.updateSettings>[0]) =>
      notificationsApi.updateSettings(patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationSettings }),
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNotificationInput) => notificationsApi.createNotification(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.adminNotifications() });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationAnalytics });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationHistory() });
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => notificationsApi.createTemplate(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationTemplates() }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      notificationsApi.updateTemplate(id, patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationTemplates() }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteTemplate(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationTemplates() }),
  });
}

export function useCancelScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (historyId: string) => notificationsApi.cancelScheduled(historyId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationHistory() });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationLogs() });
    },
  });
}

export function useProcessScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.processScheduled(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationHistory() });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notificationAnalytics });
    },
  });
}