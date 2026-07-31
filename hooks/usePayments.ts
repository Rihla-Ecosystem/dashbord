"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { paymentsApi } from "@/services/payments";
import type { AdminPaymentsQueryParams } from "@/types/payments";

export function usePayments(params: AdminPaymentsQueryParams = {}) {
  const queryParams: AdminPaymentsQueryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.payments(queryParams),
    queryFn: async () => {
      const response = await paymentsApi.list(queryParams);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function usePayment(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.payment(id ?? ""),
    queryFn: async () => {
      if (!id) {
        throw new Error("Payment ID is required");
      }

      const response = await paymentsApi.getById(id);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}
