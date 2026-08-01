"use client";

import { useQuery } from "@tanstack/react-query";
import { environmentApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";

export function useEnvironment() {
  return useQuery({
    queryKey: QUERY_KEYS.environment,
    queryFn: () => environmentApi.get(),
    refetchInterval: 5 * 60 * 1000,
  });
}
