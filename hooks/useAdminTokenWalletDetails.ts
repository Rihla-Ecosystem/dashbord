"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { tokenWalletsApi } from "@/services/token-wallets";

export function useAdminTokenWalletDetails(userId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.adminTokenWallet(userId ?? ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const response = await tokenWalletsApi.getDetails(userId);
      return response.data.data;
    },
    enabled: Boolean(userId),
  });
}
