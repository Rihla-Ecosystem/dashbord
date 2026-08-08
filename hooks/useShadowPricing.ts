"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { aiBillingApi } from "@/services/ai-billing";
import type {
  ShadowPricingObservationsQuery,
  ShadowPricingRecomputeBody,
} from "@/types/ai-billing";

export function useShadowPricingSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.shadowPricingSummary,
    queryFn: () => aiBillingApi.getShadowPricingSummary(),
  });
}

export function useShadowPricingObservations(
  params?: ShadowPricingObservationsQuery
) {
  return useQuery({
    queryKey: QUERY_KEYS.shadowPricingObservations(params),
    queryFn: () => aiBillingApi.getShadowPricingObservations(params),
  });
}

export function useRecomputeShadowPricingPreview() {
  return useMutation({
    mutationFn: (body: ShadowPricingRecomputeBody) =>
      aiBillingApi.recomputeShadowPricingPreview(body),
  });
}
