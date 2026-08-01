"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tokenWalletsApi } from "@/services/token-wallets";
import type { AdminAdjustmentInput } from "@/types/admin-token-wallet";

export function useAdjustTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: AdminAdjustmentInput;
    }) =>
      tokenWalletsApi
        .createAdjustment(userId, input)
        .then((response) => response.data.data),
    retry: false,
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-token-wallets"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-token-wallet", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-token-transactions", userId],
      });
    },
  });
}
