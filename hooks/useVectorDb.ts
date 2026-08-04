"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vectorDbApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import { toast } from "sonner";

export function useCollections() {
  return useQuery({
    queryKey: QUERY_KEYS.vectorCollections,
    queryFn: () => vectorDbApi.getCollections(),
  });
}

export function usePoints(collectionName: string, params?: { offset?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.vectorPoints(collectionName, params),
    queryFn: () => vectorDbApi.getPoints(collectionName, params),
    enabled: !!collectionName,
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vectorDbApi.deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vectorCollections });
      toast.success("Collection deleted");
    },
    onError: (error: unknown) => {
      toast.error(String(error));
    },
  });
}

export function useDeletePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionName, pointId }: { collectionName: string; pointId: number }) =>
      vectorDbApi.deletePoint(collectionName, pointId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vectorPoints(variables.collectionName),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vectorCollections });
      toast.success("Point deleted");
    },
    onError: (error: unknown) => {
      toast.error(String(error));
    },
  });
}