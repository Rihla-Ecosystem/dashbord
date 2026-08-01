"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/api";
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from "@/constants";
import type { AuditLogsQueryParams } from "@/types";

export function useAuditLogs(params?: AuditLogsQueryParams) {
  const queryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.auditLogs(queryParams),
    queryFn: () => adminApi.getAuditLogs(queryParams),
  });
}
