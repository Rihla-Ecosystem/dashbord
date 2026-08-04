"use client";

import {
  Database,
  Activity,
  Layers,
  RefreshCw,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { SkeletonGrid } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnterpriseSystemHealth, useApiMonitoringSummary, useApiMonitoring } from "@/hooks/useEnterprise";
import { useCollections } from "@/hooks/useVectorDb";
import { formatDateTime, formatNumber, formatRelative } from "@/utils";
import { cn } from "@/lib/utils";
import type { ServiceHealth, SystemHealth } from "@/types";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400" },
  ok: { dot: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400" },
  degraded: { dot: "bg-amber-500", label: "text-amber-600 dark:text-amber-400" },
  offline: { dot: "bg-red-500", label: "text-red-600 dark:text-red-400" },
  down: { dot: "bg-red-500", label: "text-red-600 dark:text-red-400" },
  unknown: { dot: "bg-muted-foreground", label: "text-muted-foreground" },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function ServiceRow({ service }: { service: ServiceHealth }) {
  const style = STATUS_STYLES[service.status] ?? STATUS_STYLES.unknown;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} />
        <div>
          <p className="text-sm font-semibold capitalize">{service.name}</p>
          {service.version && <p className="text-xs text-muted-foreground">v{service.version}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {typeof service.latencyMs === "number" && (
          <span className="text-xs tabular-nums text-muted-foreground">{service.latencyMs}ms</span>
        )}
        <Badge variant="outline" className={cn("capitalize", style.label)}>
          {service.status}
        </Badge>
      </div>
    </div>
  );
}

export default function EnvironmentPage() {
  const systemHealth = useEnterpriseSystemHealth();
  const apiSummary = useApiMonitoringSummary();
  const apiLogs = useApiMonitoring({ page: 1, limit: 25 });
  const collections = useCollections();

  const loading = systemHealth.isLoading || apiSummary.isLoading;
  const error = systemHealth.error || apiSummary.error;

  if (loading) return <SkeletonGrid cards={4} className="pt-2" />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const health = (systemHealth.data ?? {}) as SystemHealth;
  const api = apiSummary.data;
  const services = Array.isArray(health.services) ? health.services : [];
  const db = health.database;
  const logs = apiLogs.data?.logs ?? [];
  const collectionsList = collections.data ?? [];

  const totalPoints = collectionsList.reduce((sum, c) => sum + Number(c.points_count ?? 0), 0);
  const totalVectorBytes = collectionsList.reduce((sum, c) => sum + Number(c.vectors_size ?? 0), 0);

  const apiStatusData = api?.byStatus ? Object.entries(api.byStatus) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Environment & Infrastructure"
        description="Services, containers, APIs, databases, vector storage, logs and deployment health"
      >
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Overall Status" className="bg-gradient-to-br from-emerald-500/5 to-teal-500/10">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "size-3 rounded-full",
                health.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            <p className="text-2xl font-bold capitalize">{health.status ?? "unknown"}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Generated {health.time ? formatRelative(health.time) : "recently"}
          </p>
        </DashboardCard>

        <DashboardCard title="Deployment" className="bg-gradient-to-br from-blue-500/5 to-cyan-500/10">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">v{health.version ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">
                {health.uptimeSeconds ? formatUptime(health.uptimeSeconds) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response</span>
              <span className="font-medium">{health.responseTimeMs ?? "—"}ms</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="API Requests" className="bg-gradient-to-br from-violet-500/5 to-purple-500/10">
          <p className="text-3xl font-bold">{formatNumber(api?.totalRequests ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Success rate{" "}
            <span className={cn("font-semibold", (api?.successRate ?? 100) >= 95 ? "text-emerald-500" : "text-amber-500")}>
              {(api?.successRate ?? 100).toFixed(1)}%
            </span>{" "}
            · avg {(api?.averageResponseTimeMs ?? 0).toFixed(0)}ms
          </p>
        </DashboardCard>

        <DashboardCard title="Vector Database" className="bg-gradient-to-br from-pink-500/5 to-rose-500/10">
          <p className="text-3xl font-bold">{collectionsList.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Collections · {formatNumber(totalPoints)} points · {formatBytes(totalVectorBytes)}
          </p>
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard title="Containers & Services" className="lg:col-span-2">
          <div className="space-y-2.5">
            {services.map((service) => (
              <ServiceRow key={service.name} service={service} />
            ))}
          </div>
        </DashboardCard>

        <div className="space-y-6">
          <DashboardCard title="Database" description="PostgreSQL (Core-Server)">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10">
                <Database className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{db?.name ?? "core-server-postgres"}</p>
                <p className={cn("text-xs font-medium capitalize", STATUS_STYLES[db?.status ?? "unknown"].label)}>
                  {db?.status ?? "unknown"}
                </p>
              </div>
            </div>
            {db?.error && <p className="mt-2 text-xs text-red-500">{db.error}</p>}
          </DashboardCard>

          <DashboardCard title="Vector Collections" description="Qdrant">
            <ScrollArea className="max-h-52">
              <div className="space-y-2 pr-2">
                {collectionsList.length === 0 && (
                  <p className="text-sm text-muted-foreground">No collections found</p>
                )}
                {collectionsList.map((collection) => (
                  <div
                    key={collection.name}
                    className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Layers className="size-3.5 text-muted-foreground" />
                      <span className="truncate">{collection.name}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatNumber(collection.points_count)} pts
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DashboardCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Health Checks" description="Per-service latency and status">
          <div className="space-y-2.5">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium capitalize">
                  <Activity className="size-3.5 text-muted-foreground" />
                  {service.name}
                </span>
                <span className="flex items-center gap-3">
                  {service.error && <span className="text-xs text-red-500">{service.error}</span>}
                  <span className="tabular-nums text-muted-foreground">
                    {typeof service.latencyMs === "number" ? `${service.latencyMs}ms` : "—"}
                  </span>
                  <span className={cn("size-2 rounded-full", STATUS_STYLES[service.status]?.dot ?? "bg-muted-foreground")} />
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="API Status Breakdown" description="Requests grouped by HTTP status">
          {apiStatusData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API traffic recorded yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {apiStatusData.map(([status, count]) => (
                <div key={status} className="rounded-xl bg-muted/30 p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">HTTP {status}</p>
                  <p className="mt-1 text-2xl font-bold">{formatNumber(Number(count))}</p>
                </div>
              ))}
              {api?.byMethod && (
                <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                  {Object.entries(api.byMethod).map(([method, count]) => (
                    <Badge key={method} variant="secondary">
                      {method} · {formatNumber(Number(count))}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Live API Logs"
        description="Most recent requests observed by the API monitor"
        action={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            live
          </div>
        }
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-24">Latency</TableHead>
                <TableHead className="w-40">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No requests logged yet
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-xs",
                        log.method === "GET" && "text-blue-500",
                        log.method === "POST" && "text-emerald-500",
                        log.method === "PATCH" && "text-amber-500",
                        log.method === "DELETE" && "text-red-500"
                      )}
                    >
                      {log.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64 truncate font-mono text-xs">{log.path}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        log.statusCode < 400 ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {log.statusCode}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {log.durationMs}ms
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DashboardCard>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
