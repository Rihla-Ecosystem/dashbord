"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { tokenPackagesApi } from "@/services/token-packages";
import type {
  AdminTokenPackagesQueryParams,
  CreateAdminTokenPackageInput,
  UpdateAdminTokenPackageInput,
  UpdateAdminTokenPackageStatusInput,
} from "@/types/token-packages";
import { toast } from "sonner";

export function useTokenPackages(params: AdminTokenPackagesQueryParams = {}) {
  const queryParams: AdminTokenPackagesQueryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: "sortOrder",
    sortOrder: "asc",
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.tokenPackages(queryParams),
    queryFn: async () => {
      const response = await tokenPackagesApi.list(queryParams);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useTokenPackage(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.tokenPackage(id ?? -1),
    queryFn: async () => {
      if (id === null) {
        throw new Error("Token package ID is required");
      }

      const response = await tokenPackagesApi.getById(id);
      return response.data.data;
    },
    enabled: id !== null,
  });
}

export function useCreateTokenPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdminTokenPackageInput) =>
      tokenPackagesApi.create(input).then((response) => response.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token-packages"] });
      toast.success("Token package created");
    },
  });
}

export function useUpdateTokenPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: UpdateAdminTokenPackageInput;
    }) =>
      tokenPackagesApi.update(id, input).then((response) => response.data.data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["token-packages"] });
      queryClient.invalidateQueries({ queryKey: ["token-package", id] });
      toast.success("Token package updated");
    },
  });
}

export function useUpdateTokenPackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: UpdateAdminTokenPackageStatusInput;
    }) =>
      tokenPackagesApi
        .updateStatus(id, input)
        .then((response) => response.data.data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["token-packages"] });
      queryClient.invalidateQueries({ queryKey: ["token-package", id] });
      toast.success("Token package status updated");
    },
  });
}

export function useDeleteTokenPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      tokenPackagesApi.delete(id).then((response) => response.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["token-packages"] });
      queryClient.removeQueries({ queryKey: ["token-package", data.id] });
      toast.success("Token package deleted");
    },
  });
}
