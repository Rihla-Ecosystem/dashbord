"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, clearTokens, setTokens, usersApi } from "@/services/api";
import type { LoginRequest, RegisterRequest, User, UserRole } from "@/types";
import { QUERY_KEYS } from "@/constants";
import { getErrorMessage, hasRole, isModeratorOrAbove } from "@/utils";
import { toast } from "sonner";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isModeratorOrAbove: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user = null, isLoading } = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: () => usersApi.getMe(),
    retry: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.profile,
        queryFn: () => usersApi.getMe(),
      });
      queryClient.setQueryData(QUERY_KEYS.profile, data);
    } catch {
      queryClient.setQueryData(QUERY_KEYS.profile, null);
      clearTokens();
    }
  }, [queryClient]);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const response = await authApi.login(data);
        setTokens({ accessToken: response.accessToken, refreshToken: "" });
        queryClient.setQueryData(QUERY_KEYS.profile, response.user);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
      }
    },
    [queryClient, router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        await authApi.register(data);
        toast.success("Account created successfully!");
        router.push("/login");
      } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      clearTokens();
      queryClient.setQueryData(QUERY_KEYS.profile, null);
      router.push("/login");
      toast.success("Logged out successfully");
    }
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      hasRole: (roles: UserRole[]) => hasRole(user?.role, roles),
      isAdmin: user?.role === "ADMIN",
      isModeratorOrAbove: isModeratorOrAbove(user?.role),
    }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
