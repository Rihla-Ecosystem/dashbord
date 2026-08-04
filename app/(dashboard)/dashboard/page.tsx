"use client";

import Link from "next/link";
import {
  Users,
  Activity,
  DollarSign,
  Zap,
  Bot,
  Server,
  Database,
  ShieldAlert,
  RefreshCw,
  Cpu,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { SkeletonGrid } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/utils";
import type { AiUsageSummary, ApiMonitoringSummary, PlatformOverview, SystemHealth } from "@/types";
import { useEnterpriseOverview, useEnterpriseSystemHealth, useAiUsage, useApiMonitoringSummary } from "@/hooks/useEnterprise";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";

const COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#ec4899", "#14b8a6"];

const STATUS_STYLES: Record<string, string> = {
  online: "bg-emerald-500",
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  offline: "bg-red-500",
  down: "bg-red-500",
  unknown: "bg-muted-foreground",
};

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function DashboardPage() {
  const overview = useEnterpriseOverview();
  const systemHealth = useEnterpriseSystemHealth();
  const aiUsage = useAiUsage();
  const apiSummary = useApiMonitoringSummary();
  const { data: auditData } = useAuditLogs({ limit: 8 });
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enterpriseOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enterpriseSystemHealth });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enterpriseAiUsage });
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient]);

  const loading = overview.isLoading || systemHealth.isLoading;
  const error = overview.error || systemHealth.error;

  if (loading) return <SkeletonGrid cards={6} />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const overviewData = (overview.data ?? {}) as PlatformOverview;
  const health = (systemHealth.data ?? {}) as SystemHealth;
  const ai: AiUsageSummary | undefined = aiUsage.data;
  const api: ApiMonitoringSummary | undefined = apiSummary.data;

  const users = overviewData.users ?? ({} as NonNullable<PlatformOverview["users"]>);
  const payments = overviewData.payments ?? ({} as NonNullable<PlatformOverview["payments"]>);
  const tokens = overviewData.tokens ?? ({} as NonNullable<PlatformOverview["tokens"]>);
  const content = overviewData.content ?? ({} as NonNullable<PlatformOverview["content"]>);

  const services = Array.isArray(health.services) ? health.services : [];
  const healthyCount = services.filter((s) => s.status === "online").length;
  const dbOnline = health.database?.status === "online";

  const aiDaily = Array.isArray(ai?.daily) ? ai.daily.map((d) => ({ name: d.day, tokens: d.totalTokens, cost: d.cost })).slice(-14) : [];
  const modelCost = Array.isArray(ai?.perModel) ? ai.perModel.map((m) => ({ name: `${m.source} · ${m.model}`, value: m.cost })).slice(0, 6) : [];
  const paymentStatus = payments.byStatus
    ? Object.entries(payments.byStatus).map(([name, value]) => ({ name, value: safeNumber(value?.count) }))
    : [];
  const entityData = [
    { name: "Badges", value: safeNumber(content.badges) },
    { name: "Journeys", value: safeNumber(content.journeys) },
    { name: "Trips", value: safeNumber(content.trips) },
    { name: "Convs", value: safeNumber(content.conversations) },
    { name: "Txns", value: safeNumber(content.transactions) },
    { name: "Msgs", value: safeNumber(content.messages) },
  ];
  const apiStatusData = api?.byStatus ? Object.entries(api.byStatus).map(([name, value]) => ({ name: String(name), value: safeNumber(value) })) : [];

  const apiErrorRate = api?.totalRequests ? (safeNumber(api.errors) / api.totalRequests) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Admin Overview"
        description="Live platform intelligence across Core-Server, AI-Service, GeoContext, PostgreSQL & Vector DB"
      >
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/environment" />}>
          <Server className="size-4" />
          Infrastructure
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </PageHeader>

      <DashboardCard title="Platform Health" description="Service, database and API health at a glance">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10">
              <Server className="size-5 text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Services Online</p>
              <p className="text-2xl font-bold">{healthyCount} / {services.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10">
              <Database className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PostgreSQL</p>
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${dbOnline ? "bg-emerald-500" : "bg-red-500"}`} />
                <p className="text-sm font-semibold capitalize">{health.database?.status ?? "unknown"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="size-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI Requests</p>
              <p className="text-2xl font-bold">{formatNumber(safeNumber(ai?.summary?.totalCalls))}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10">
              <ShieldAlert className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">API Success Rate</p>
              <p className="text-2xl font-bold">{safeNumber(api?.successRate).toFixed(1)}%</p>
              {apiErrorRate > 5 && <p className="text-xs font-medium text-red-500">Elevated error rate</p>}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((service) => (
            <Badge key={service.name} variant="outline" className="gap-1.5 capitalize">
              <span className={`size-2 rounded-full ${STATUS_STYLES[service.status] ?? STATUS_STYLES.unknown}`} />
              {service.name}
              {typeof service.latencyMs === "number" && (
                <span className="text-muted-foreground">{service.latencyMs}ms</span>
              )}
            </Badge>
          ))}
        </div>
      </DashboardCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Users"
          value={formatNumber(safeNumber(users.total))}
          icon={<Users className="size-5" />}
          trend={safeNumber(users.totalXp)}
          trendLabel="total XP"
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="Active Sessions"
          value={formatNumber(safeNumber(users.activeSessions))}
          icon={<Activity className="size-5" />}
          trend={safeNumber(users.averageLevel)}
          trendLabel="avg level"
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Revenue"
          value={`$${formatNumber(Math.round(safeNumber(payments.totalRevenue)))}`}
          icon={<DollarSign className="size-5" />}
          trend={safeNumber(payments.total)}
          trendLabel="payments"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Wallet Tokens"
          value={formatNumber(Math.round(safeNumber(tokens.walletBalance)))}
          icon={<Zap className="size-5" />}
          trend={safeNumber(tokens.walletCount)}
          trendLabel="wallets"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="AI Tokens"
          value={formatNumber(safeNumber(ai?.summary?.totalTokens))}
          icon={<Cpu className="size-5" />}
          trend={safeNumber(ai?.summary?.cost)}
          trendLabel="cost ($)"
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          title="Audit Events"
          value={formatNumber(safeNumber(content.auditLogs))}
          icon={<FileText className="size-5" />}
          trend={safeNumber(payments.byStatus?.["FAILED"]?.count)}
          trendLabel="failed payments"
          gradient="bg-gradient-to-br from-brand to-brand-dark"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="AI Usage" description="Token consumption over the last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aiDaily}>
              <defs>
                <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" fill="url(#aiGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="API Monitoring" description="Requests by HTTP status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={apiStatusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Status" description="Payment distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={paymentStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={96} paddingAngle={3}>
                {paymentStatus.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Content & Entities" description="Platform content counts">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={entityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardCard title="AI Cost by Model" className="xl:col-span-1">
          {modelCost.length > 0 ? (
            <div className="space-y-3">
              {modelCost.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No AI usage recorded yet</p>
          )}
        </DashboardCard>

        <DashboardCard title="API Performance" className="xl:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Requests</p>
              <p className="mt-1 text-2xl font-bold">{formatNumber(safeNumber(api?.totalRequests))}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Latency</p>
              <p className="mt-1 text-2xl font-bold">{safeNumber(api?.averageResponseTimeMs).toFixed(0)}ms</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Errors</p>
              <p className={`mt-1 text-2xl font-bold ${apiErrorRate > 5 ? "text-red-500" : "text-emerald-600"}`}>
                {formatNumber(safeNumber(api?.errors))}
              </p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">System Uptime</p>
              <p className="mt-1 text-2xl font-bold">{Math.round(safeNumber(health.uptimeSeconds) / 3600)}h</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Core Server</span>
            <span className="font-medium capitalize">{health.status ?? "unknown"}</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Activity" description="Latest audit logs">
          <ActivityTimeline logs={auditData?.data ?? []} />
        </DashboardCard>
      </div>
    </div>
  );
}
