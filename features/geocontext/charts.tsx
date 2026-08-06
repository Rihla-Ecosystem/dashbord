"use client";

import { Building2, Clock, MapPinned, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";
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

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; payload?: { fill?: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: entry.payload?.fill ?? "#0b6f6b" }} />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

const tooltipProps = {
  content: <ChartTooltipContent />,
  cursor: { fill: "rgba(120,120,120,0.08)" },
};

export function CategoryDonutChart({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const data = (analytics?.byCategory ?? []).map((entry) => ({
    name: categoryMeta(entry.category).label,
    value: entry.count,
    fill: categoryMeta(entry.category).color,
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const top = data.length ? data.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  return (
    <ChartCard title="Locations by category" description="Distribution across categories">
      {isLoading ? (
        <ChartSkeleton />
      ) : data.length ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2} strokeWidth={0} cornerRadius={6}>
                {data.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">locations</p>
            {top && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">Top: {top.name}</p>
            )}
          </div>
        </div>
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
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Warnings" radius={[6, 6, 0, 0]} maxBarSize={44}>
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

export function CoverageGauge({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const value = analytics?.governoratesCoverage ?? 0;
  const data = [{ name: "Coverage", value, fill: "#8b5cf6" }];
  return (
    <ChartCard title="Governorate coverage" description="Share of Egypt covered by dataset">
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="62%" outerRadius="100%" startAngle={220} endAngle={-40}>
              <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={10} />
              <Tooltip content={<ChartTooltipContent />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-violet-500">{value}%</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">coverage</p>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export function TopUpdatedList({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const items = analytics?.topUpdated ?? [];
  const max = items.reduce((m, it) => Math.max(m, Date.parse(it.updatedAt)), 0) || 1;
  return (
    <ChartCard title="Recently updated" description="Latest content edits">
      {isLoading ? (
        <ChartSkeleton />
      ) : items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const recency = max ? Math.round((Date.parse(item.updatedAt) / max) * 40) + 60 : 100;
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-primary/[0.04] to-transparent px-3 py-2">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, hsl(${210 - index * 14} 80% 50%), hsl(${160 - index * 10} 70% 42%))` }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/50" style={{ width: `${recency}%` }} />
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {formatRelative(item.updatedAt)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No updates yet</p>
      )}
    </ChartCard>
  );
}

export function RiskDistribution({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const restricted = analytics?.restrictedAreas ?? 0;
  const tourist = analytics?.touristPlaces ?? 0;
  const total = analytics?.totalLocations ?? 0;
  const safe = total > 0 ? Math.max(0, total - restricted - tourist) : 0;
  const data = [
    { name: "Tourist / Open", value: tourist, fill: "#0ea5e9" },
    { name: "Restricted", value: restricted, fill: "#ef4444" },
    { name: "Other", value: safe, fill: "#94a3b8" },
  ];

  return (
    <ChartCard title="Dataset composition" description="Relative share of location types">
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" name="Locations" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function CategoryLegend({ analytics, isLoading }: { analytics?: GeoAnalytics; isLoading: boolean }) {
  const data = (analytics?.byCategory ?? []).map((entry) => ({
    ...categoryMeta(entry.category),
    count: entry.count,
  }));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  data.sort((a, b) => b.count - a.count);
  return (
    <ChartCard title="Category legend" description="Interactive breakdown">
      {isLoading ? (
        <ChartSkeleton />
      ) : data.length ? (
        <ul className="space-y-1.5">
          {data.map((item) => (
            <li key={item.value} className="flex items-center gap-2.5 text-sm">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 truncate">{item.label}</span>
              <span className="text-xs text-muted-foreground">{total ? Math.round((item.count / total) * 100) : 0}%</span>
              <span className="w-8 text-right font-semibold">{item.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No data</p>
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