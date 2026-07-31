"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartCard } from "@/components/shared/ChartCard";
import type { User } from "@/types";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#64748b"];

interface GenderChartProps {
  users: User[];
}

export function GenderChart({ users }: GenderChartProps) {
  const counts = users.reduce<Record<string, number>>((acc, u) => {
    const key = u.gender ?? "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  if (!data.length) {
    data.push({ name: "No data", value: 1 });
  }

  return (
    <ChartCard title="Gender Distribution">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12 }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
