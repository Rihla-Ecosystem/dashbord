"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardUser(id),
    queryFn: () => dashboardApi.getUser(id),
    enabled: !!id,
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userBadges(userId),
    queryFn: () => dashboardApi.getUserBadges(userId),
    enabled: !!userId,
  });
}
