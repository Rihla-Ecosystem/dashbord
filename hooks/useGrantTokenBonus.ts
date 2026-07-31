"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tokenWalletsApi } from "@/services/token-wallets";
import type { AdminBonusInput } from "@/types/admin-token-wallet";

export function useGrantTokenBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: AdminBonusInput;
    }) =>
      tokenWalletsApi.grantBonus(userId, input).then((response) => response.data.data),
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
