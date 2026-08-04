"use client";

import { Building2, MapPinned, ShieldAlert, Sparkles, TriangleAlert, Clock } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatCard } from "@/components/shared/StatCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { categoryMeta, severityMeta } from "@/constants/geocontext";
import { formatRelative } from "@/utils";
import type { GeoAnalytics } from "@/types/geocontext";

export function GeoStatsGrid({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const data = analytics;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Total locations"
        value={isLoading ? "…" : (data?.totalLocations ?? 0)}
        icon={<MapPinned className="size-5" />}
        gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
      />
      <StatCard
        title="Tourist places"
        value={isLoading ? "…" : (data?.touristPlaces ?? 0)}
        icon={<Building2 className="size-5" />}
        gradient="bg-gradient-to-br from-sky-500 to-indigo-600"
      />
      <StatCard
        title="Restricted areas"
        value={isLoading ? "…" : (data?.restrictedAreas ?? 0)}
        icon={<TriangleAlert className="size-5" />}
        gradient="bg-gradient-to-br from-rose-500 to-red-600"
      />
      <StatCard
        title="Active warnings"
        value={isLoading ? "…" : (data?.activeWarnings ?? 0)}
        icon={<ShieldAlert className="size-5" />}
        gradient="bg-gradient-to-br from-amber-500 to-orange-600"
      />
      <StatCard
        title="Gov. coverage"
        value={isLoading ? "…" : `${data?.governoratesCoverage ?? 0}%`}
        icon={<Sparkles className="size-5" />}
        gradient="bg-gradient-to-br from-violet-500 to-purple-600"
      />
    </div>
  );
}

export function CategoryPieChart({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const data = (analytics?.byCategory ?? []).map((entry) => ({
    name: categoryMeta(entry.category).label,
    value: entry.count,
    fill: categoryMeta(entry.category).color,
  }));

  return (
    <ChartCard title="Locations by category" description="Distribution across categories">
      {isLoading ? (
        <ChartSkeleton />
      ) : data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={96} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground">No data</p>
      )}
    </ChartCard>
  );
}

export function SeverityBarChart({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const data = (analytics?.warningsBySeverity ?? []).map((entry) => ({
    name: severityMeta(entry.severity).label,
    value: entry.count,
    fill: severityMeta(entry.severity).color,
  }));

  return (
    <ChartCard title="Warnings by severity" description="Active + historical warnings">
      {isLoading ? (
        <ChartSkeleton />
      ) : data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground">No data</p>
      )}
    </ChartCard>
  );
}

export function TopUpdatedList({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const items = analytics?.topUpdated ?? [];
  return (
    <ChartCard title="Recently updated" description="Latest content edits">
      {isLoading ? (
        <ChartSkeleton />
      ) : items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {formatRelative(item.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No updates yet</p>
      )}
    </ChartCard>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="size-24 animate-pulse rounded-full bg-muted/40" />
    </div>
  );
}
