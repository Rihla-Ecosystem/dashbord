"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/ChartCard";
import type { User } from "@/types";

interface XpChartProps {
  users: User[];
}

export function XpChart({ users }: XpChartProps) {
  const buckets = [
    { name: "0-100", min: 0, max: 100 },
    { name: "101-500", min: 101, max: 500 },
    { name: "501-1K", min: 501, max: 1000 },
    { name: "1K-5K", min: 1001, max: 5000 },
    { name: "5K+", min: 5001, max: Infinity },
  ];

  const data = buckets.map((b) => ({
    name: b.name,
    users: users.filter((u) => u.xp >= b.min && u.xp <= b.max).length,
  }));

  return (
    <ChartCard title="XP Distribution">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 12 }} />
          <Bar dataKey="users" fill="#0B6F6B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
