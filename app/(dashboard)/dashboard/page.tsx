"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Users,
  Shield,
  UserCheck,
  BadgeCheck,
  Zap,
  Activity,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatNumber, formatXp } from "@/utils";
import { RecentUsersTable } from "@/features/dashboard/RecentUsersTable";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";
import { dashboardApi } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { ChartCard } from "@/components/shared/ChartCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

const UsersGrowthChart = dynamic(
  () => import("@/features/dashboard/charts/UsersGrowthChart").then((m) => m.UsersGrowthChart),
  { ssr: false, loading: () => <div className="h-75 animate-pulse rounded-xl bg-muted" /> }
);
const GenderChart = dynamic(
  () => import("@/features/dashboard/charts/GenderChart").then((m) => m.GenderChart),
  { ssr: false, loading: () => <div className="h-75 animate-pulse rounded-xl bg-muted" /> }
);
const NationalityChart = dynamic(
  () => import("@/features/dashboard/charts/NationalityChart").then((m) => m.NationalityChart),
  { ssr: false, loading: () => <div className="h-75 animate-pulse rounded-xl bg-muted" /> }
);
const XpChart = dynamic(
  () => import("@/features/dashboard/charts/XpChart").then((m) => m.XpChart),
  { ssr: false, loading: () => <div className="h-75 animate-pulse rounded-xl bg-muted" /> }
);

const COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e"];

export default function DashboardPage() {
  const { data: usersData, isLoading, error, refetch } = useUsers({ limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const { data: auditData } = useAuditLogs({ limit: 10 });
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => dashboardApi.getStatistics(),
  });
  const retentionQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardRetention,
    queryFn: () => dashboardApi.getRetention(),
  });
  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardCountries,
    queryFn: () => dashboardApi.getCountries(),
  });
  const languagesQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardLanguages,
    queryFn: () => dashboardApi.getLanguages(),
  });
  const growthQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardGrowth({ range: "monthly" }),
    queryFn: () => dashboardApi.getGrowth({ range: "monthly" }),
  });
  const revenueQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardRevenue({ range: "monthly" }),
    queryFn: () => dashboardApi.getRevenue({ range: "monthly" }),
  });
  const topUsersQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardTopUsers,
    queryFn: () => dashboardApi.getTopUsers(),
  });

  if (isLoading) return <PageLoader />;
  if (error)
    {
      console.log("Error fetching dashboard data:", error);
      return <ErrorState onRetry={() => refetch()} />;
    } 

  const users = usersData?.data ?? [];
  const stats = statsQuery.data ?? {};
  const topUserRows = Array.isArray((topUsersQuery.data as Record<string, unknown> | undefined)?.topXp)
    ? ((topUsersQuery.data as Record<string, unknown>).topXp as Array<{ id: string; displayName?: string; email?: string; xp?: number }>)
    : [];

  const countrySeries = countriesQuery.data ?? [];
  const languageSeries = languagesQuery.data ?? [];
  const revenueSeries = revenueQuery.data ?? [];
  const retention = retentionQuery.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Live platform metrics, activity, and growth signals"
      >
        <Button variant="outline" size="sm" render={<Link href="/analytics" />}>
          <TrendingUp className="size-4" />
          Analytics
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/users" />}>
          <Users className="size-4" />
          Users
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Users"
          value={formatNumber(Number((stats as Record<string, unknown>).totalUsers ?? usersData?.total ?? users.length))}
          icon={<Users className="size-5" />}
          trend={Number((stats as Record<string, unknown>).newUsersToday ?? 0)}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="New Users"
          value={formatNumber(Number((stats as Record<string, unknown>).newUsersToday ?? growthQuery.data?.slice(-1)?.[0]?.value ?? 0))}
          icon={<Shield className="size-5" />}
          trend={Number((stats as Record<string, unknown>).newUsersThisWeek ?? 0)}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Revenue"
          value={formatNumber(Number((stats as Record<string, unknown>).revenueToday ?? revenueSeries.reduce((sum, item) => sum + Number(item.value), 0) ?? 0))}
          icon={<UserCheck className="size-5" />}
          trend={Number((stats as Record<string, unknown>).revenueThisWeek ?? 0)}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Payments"
          value={formatNumber(Number((stats as Record<string, unknown>).completedPayments ?? 0))}
          icon={<BadgeCheck className="size-5" />}
          trend={Number((stats as Record<string, unknown>).pendingPayments ?? 0)}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Wallet Tokens"
          value={formatNumber(Number((stats as Record<string, unknown>).totalWalletTokens ?? 0))}
          icon={<Zap className="size-5" />}
          trend={Number((stats as Record<string, unknown>).averageWalletBalance ?? 0)}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          title="Verified Users"
          value={formatNumber(Number((stats as Record<string, unknown>).verifiedUsers ?? users.filter((u) => u.verified).length))}
          icon={<Activity className="size-5" />}
          trend={Number((stats as Record<string, unknown>).activeUsers ?? 0)}
          gradient="bg-gradient-to-br from-brand to-brand-dark"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UsersGrowthChart users={users} series={growthQuery.data ?? []} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue" description="Monthly revenue trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Countries" description="User nationality distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={countrySeries} dataKey="value" nameKey="name" innerRadius={48} outerRadius={96} paddingAngle={3}>
                {countrySeries.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard title="Languages">
          <div className="space-y-3">
            {languageSeries.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Retention">
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(retention).slice(0, 3).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{String(value)}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Top Users">
          <div className="space-y-3">
            {topUserRows.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <span className="truncate text-sm font-medium">{user.displayName ?? user.email ?? user.id}</span>
                <span className="text-sm text-muted-foreground">{formatXp(user.xp ?? 0)}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
