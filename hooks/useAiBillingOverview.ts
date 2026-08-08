"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { aiBillingApi } from "@/services/ai-billing";

export function useAiBillingOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.aiUsage,
    queryFn: () => aiBillingApi.getAiUsageSummary(),
  });
}
