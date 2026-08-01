"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { tokenWalletsApi } from "@/services/token-wallets";
import type { AdminTokenWalletQueryParams } from "@/types/admin-token-wallet";

export function useAdminTokenWallets(params: AdminTokenWalletQueryParams = {}) {
  const queryParams: AdminTokenWalletQueryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.adminTokenWallets(queryParams),
    queryFn: async () => {
      const response = await tokenWalletsApi.list(queryParams);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
