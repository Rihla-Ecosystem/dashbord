"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, clearTokens, setTokens, usersApi } from "@/services/api";
import type { LoginRequest, RegisterRequest, User, UserRole } from "@/types";
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApi.getMe();
      setUser(data);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const { data: response } = await authApi.login(data);
        setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        setUser(response.user);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const { data: response } = await authApi.register(data);
        setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        setUser(response.user);
        toast.success("Account created successfully!");
        router.push("/dashboard");
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
      setUser(null);
      router.push("/login");
      toast.success("Logged out successfully");
    }
  }, [router]);

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
