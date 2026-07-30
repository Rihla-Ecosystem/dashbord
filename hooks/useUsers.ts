"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/api";
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from "@/constants";
import type { UsersQueryParams, UserRole } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils";

export function useUsers(params?: UsersQueryParams) {
  const queryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.users(queryParams),
    queryFn: () => adminApi.getUsers(queryParams).then((r) => r.data),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["users"] });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminApi.updateUserRole(id, role).then((r) => r.data),
    onSuccess: () => {
      toast.success("Role updated successfully");
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const banUser = useMutation({
    mutationFn: ({ id, banned, reason }: { id: string; banned: boolean; reason?: string }) =>
      adminApi.banUser(id, banned, reason).then((r) => r.data),
    onSuccess: (_, { banned }) => {
      toast.success(banned ? "User banned" : "User unbanned");
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { updateRole, banUser };
}
