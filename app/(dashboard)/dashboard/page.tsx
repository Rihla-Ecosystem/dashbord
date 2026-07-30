"use client";

import dynamic from "next/dynamic";
import {
  Users,
  Shield,
  UserCheck,
  BadgeCheck,
  Zap,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useUsers } from "@/hooks/useUsers";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatNumber, formatXp } from "@/utils";
import { RecentUsersTable } from "@/features/dashboard/RecentUsersTable";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";

const UsersGrowthChart = dynamic(
  () => import("@/features/dashboard/charts/UsersGrowthChart").then((m) => m.UsersGrowthChart),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" /> }
);
const GenderChart = dynamic(
  () => import("@/features/dashboard/charts/GenderChart").then((m) => m.GenderChart),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" /> }
);
const NationalityChart = dynamic(
  () => import("@/features/dashboard/charts/NationalityChart").then((m) => m.NationalityChart),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" /> }
);
const XpChart = dynamic(
  () => import("@/features/dashboard/charts/XpChart").then((m) => m.XpChart),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" /> }
);

export default function DashboardPage() {
  const { data: usersData, isLoading, error, refetch } = useUsers({ limit: 100 });
  const { data: auditData } = useAuditLogs({ limit: 10 });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const users = usersData?.data ?? [];
  const stats = {
    totalUsers: usersData?.total ?? users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    moderators: users.filter((u) => u.role === "MODERATOR").length,
    verifiedUsers: users.filter((u) => u.verified).length,
    averageXp: users.length
      ? Math.round(users.reduce((s, u) => s + u.xp, 0) / users.length)
      : 0,
    activeSessions: Math.floor((usersData?.total ?? users.length) * 0.15),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your platform metrics and activity"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          icon={<Users className="size-5" />}
          trend={12}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="Admins"
          value={formatNumber(stats.admins)}
          icon={<Shield className="size-5" />}
          trend={0}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Moderators"
          value={formatNumber(stats.moderators)}
          icon={<UserCheck className="size-5" />}
          trend={5}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Verified Users"
          value={formatNumber(stats.verifiedUsers)}
          icon={<BadgeCheck className="size-5" />}
          trend={8}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Average XP"
          value={formatXp(stats.averageXp)}
          icon={<Zap className="size-5" />}
          trend={3}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          title="Active Sessions"
          value={formatNumber(stats.activeSessions)}
          icon={<Activity className="size-5" />}
          trend={-2}
          gradient="bg-gradient-to-br from-brand to-brand-dark"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UsersGrowthChart users={users} />
        <GenderChart users={users} />
        <NationalityChart users={users} />
        <XpChart users={users} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardCard title="Recent Users" className="xl:col-span-2">
          <RecentUsersTable users={users.slice(0, 8)} />
        </DashboardCard>
        <DashboardCard title="Recent Activity" description="Latest audit logs">
          <ActivityTimeline logs={auditData?.data ?? []} />
        </DashboardCard>
      </div>
    </div>
  );
}
