"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import type { UpdateProfileRequest } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils";
import { useAuth } from "@/features/auth/auth-context";

export function useProfile() {
  const { refreshUser } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: () => usersApi.getMe().then((r) => r.data),
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    refreshUser();
  };

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      usersApi.updateMe(data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Profile updated");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file).then((r) => r.data),
    onSuccess: () => {
      toast.success("Avatar uploaded");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteAvatar = useMutation({
    mutationFn: () => usersApi.deleteAvatar().then((r) => r.data),
    onSuccess: () => {
      toast.success("Avatar removed");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteAccount = useMutation({
    mutationFn: () => usersApi.deleteMe(),
    onSuccess: () => toast.success("Account deleted"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { updateProfile, uploadAvatar, deleteAvatar, deleteAccount };
}
