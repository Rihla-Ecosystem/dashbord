"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { aiBillingApi } from "@/services/ai-billing";
import type { BillingRecoveryQueueQuery } from "@/types/ai-billing";

export function useBillingRecoveryQueue(params?: BillingRecoveryQueueQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.billingRecovery(params),
    queryFn: () => aiBillingApi.getBillingRecoveryQueue(params),
  });
}
