"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/ChartCard";
import type { User } from "@/types";
import { format, parseISO, subMonths } from "date-fns";
import type { DashboardSeriesPoint } from "@/types";

interface UsersGrowthChartProps {
  users: User[];
  series?: DashboardSeriesPoint[];
}

export function UsersGrowthChart({ users, series }: UsersGrowthChartProps) {
  const months =
    series?.length
      ? series.map((point) => ({ name: point.name, users: Number(point.value) }))
      : Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const nextDate = subMonths(new Date(), 4 - i);
          const count = users.filter((u) => {
            const created = parseISO(u.createdAt);
            return created >= date && created < nextDate;
          }).length;
          return { name: format(date, "MMM"), users: count };
        });

  return (
    <ChartCard title="Users Growth" description="New user registrations over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={months}>
          <defs>
            <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
          <Area
            type="monotone"
            dataKey="users"
            stroke="hsl(var(--primary))"
            fill="url(#usersGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
