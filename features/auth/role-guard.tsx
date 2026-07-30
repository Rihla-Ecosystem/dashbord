"use client";

import { useAuth } from "@/features/auth/auth-context";
import type { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/shared/LoadingSpinner";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasRole(roles)) {
      router.replace("/403");
    }
  }, [isLoading, user, hasRole, roles, router]);

  if (isLoading) return <PageLoader />;
  if (!user || !hasRole(roles)) return fallback ?? null;

  return <>{children}</>;
}
