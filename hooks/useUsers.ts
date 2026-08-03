"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from "@/constants";
import type { DashboardUserFilters, UserRole } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils";

export function useUsers(params?: DashboardUserFilters) {
  const queryParams = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    ...params,
  };

  return useQuery({
    queryKey: QUERY_KEYS.dashboardUsers(queryParams),
    queryFn: () => dashboardApi.getUsers(queryParams),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardUsers() });

  const createUser = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      displayName: string;
      avatarUrl?: string;
      bio?: string;
      gender: 'MALE' | 'FEMALE';
      nationality: string;
      language?: string[];
      budgetLevel?: string;
      arrivalDate?: string;
      departureDate?: string;
      travelStyle?: string;
      interests?: string[];
      accommodationType?: string;
      roleId?: number;
    }) => dashboardApi.createUser(data),
    onSuccess: () => {
      toast.success('User created');
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      dashboardApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated');
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      dashboardApi.updateUserRole(id, role === 'ADMIN' ? 3 : role === 'MODERATOR' ? 2 : 1),
    onSuccess: () => {
      toast.success('Role updated successfully');
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const banUser = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean; reason?: string }) =>
      dashboardApi.banUser(id, banned),
    onSuccess: (_, { banned }) => {
      toast.success(banned ? 'User banned' : 'User unbanned');
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => dashboardApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      invalidateUsers();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { createUser, updateUser, updateRole, banUser, deleteUser };
}
