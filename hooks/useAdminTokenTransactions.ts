"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { tokenWalletsApi } from "@/services/token-wallets";
import type { AdminTokenTransactionsQueryParams } from "@/types/admin-token-wallet";

export function useAdminTokenTransactions(
  userId: string | null,
  params: AdminTokenTransactionsQueryParams = {}
) {
  const queryParams: AdminTokenTransactionsQueryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortOrder: "desc",
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.adminTokenTransactions(userId ?? "", queryParams),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const response = await tokenWalletsApi.getTransactions(userId, queryParams);
      return response.data.data;
    },
    enabled: Boolean(userId),
    placeholderData: (previousData) => previousData,
  });
}
