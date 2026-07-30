"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, usersApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: async () => {
      const { data } = await adminApi.getUsers({ search: id, limit: 1 });
      return data.data[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userBadges(userId),
    queryFn: () => usersApi.getBadges(userId).then((r) => r.data),
    enabled: !!userId,
  });
}
