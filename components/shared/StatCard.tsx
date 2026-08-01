"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  gradient: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  gradient,
  className,
}: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend >= 0;
  const isZero = hasTrend && trend === 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm",
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-[0.07] transition-opacity group-hover:opacity-[0.12]",
          gradient
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {hasTrend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isZero
                  ? "text-muted-foreground"
                  : isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
              )}
            >
              {isZero ? (
                <Minus className="size-3.5" />
              ) : isPositive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              <span>{trendLabel ?? `${Math.abs(trend)}`}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl text-white shadow-lg",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
