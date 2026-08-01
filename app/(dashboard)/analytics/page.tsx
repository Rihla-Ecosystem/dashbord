"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUERY_KEYS } from "@/constants";
import { dashboardApi } from "@/services/api";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("monthly");

  const growthQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardGrowth({ range }),
    queryFn: () => dashboardApi.getGrowth({ range }),
  });
  const revenueQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardRevenue({ range }),
    queryFn: () => dashboardApi.getRevenue({ range }),
  });
  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardCountries,
    queryFn: () => dashboardApi.getCountries(),
  });
  const languagesQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardLanguages,
    queryFn: () => dashboardApi.getLanguages(),
  });
  const retentionQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardRetention,
    queryFn: () => dashboardApi.getRetention(),
  });

  const loading = growthQuery.isLoading || revenueQuery.isLoading || countriesQuery.isLoading || languagesQuery.isLoading || retentionQuery.isLoading;
  const error = growthQuery.error || revenueQuery.error || countriesQuery.error || languagesQuery.error || retentionQuery.error;

  if (loading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const growth = growthQuery.data ?? [];
  const revenue = revenueQuery.data ?? [];
  const countries = countriesQuery.data ?? [];
  const languages = languagesQuery.data ?? [];
  const retention = retentionQuery.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Users, revenue, retention, and geographic trends">
        <Select value={range} onValueChange={(v) => { if (v) setRange(v); }}>
          <SelectTrigger className="w-35 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User Growth" description={`User creation trends (${range})`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#growthGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue" description={`Revenue trends (${range})`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Countries" description="Users grouped by nationality">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={countries} dataKey="value" nameKey="name" innerRadius={48} outerRadius={96} paddingAngle={3}>
                {countries.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Languages" description="Language usage distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={languages} dataKey="value" nameKey="name" innerRadius={48} outerRadius={96} paddingAngle={3}>
                {languages.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.entries(retention).slice(0, 3).map(([label, value]) => (
          <DashboardCard key={label} title={label}>
            <p className="text-3xl font-bold">{String(value)}</p>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}