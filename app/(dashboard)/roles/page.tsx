"use client";

import { Shield, Users, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useUsers } from "@/hooks/useUsers";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";

const ROLES = [
  {
    role: "ADMIN" as const,
    icon: Shield,
    description: "Full access to all features, user management, and system settings.",
    permissions: ["Manage users", "Change roles", "View audit logs", "System settings"],
  },
  {
    role: "MODERATOR" as const,
    icon: UserCheck,
    description: "Can manage users, view audit logs, and moderate content.",
    permissions: ["Manage users", "Ban users", "View audit logs", "Manage badges"],
  },
  {
    role: "USER" as const,
    icon: Users,
    description: "Standard user with access to profile and geo services.",
    permissions: ["View profile", "Edit profile", "Geo services", "Environment data"],
  },
];

export default function RolesPage() {
  const { data, isLoading } = useUsers({ limit: 100 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles" description="Role definitions and permissions overview" />
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  const users = data?.data ?? [];
  const counts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    MODERATOR: users.filter((u) => u.role === "MODERATOR").length,
    USER: users.filter((u) => u.role === "USER").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Role definitions and permissions overview" />

      <div className="grid gap-6 md:grid-cols-3">
        {ROLES.map(({ role, icon: Icon, description, permissions }) => (
          <DashboardCard key={role} title="">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <div>
                  <RoleBadge role={role} />
                  <p className="mt-1 text-2xl font-bold">{counts[role]}</p>
                  <p className="text-xs text-muted-foreground">users</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <ul className="space-y-1.5">
                {permissions.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
