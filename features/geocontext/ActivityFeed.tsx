"use client";

import { Activity, Landmark, MapPinned, ShieldAlert, SlashSquare, Webhook } from "lucide-react";
import { formatRelative } from "@/utils";
import type { ActivityEvent } from "@/types/geocontext";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading: boolean;
  className?: string;
}

const TYPE_META: Record<ActivityEvent["type"], { icon: React.ReactNode; color: string; bg: string }> = {
  location: { icon: <MapPinned className="size-3.5" />, color: "text-teal-600", bg: "bg-teal-500/10" },
  warning: { icon: <ShieldAlert className="size-3.5" />, color: "text-amber-600", bg: "bg-amber-500/10" },
  zone: { icon: <SlashSquare className="size-3.5" />, color: "text-rose-600", bg: "bg-rose-500/10" },
  boundary: { icon: <Landmark className="size-3.5" />, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  system: { icon: <Webhook className="size-3.5" />, color: "text-slate-600", bg: "bg-slate-500/10" },
};

export function ActivityFeed({ events, isLoading, className }: ActivityFeedProps) {
  return (
    <div className={cn("w-full rounded-2xl border border-border/50 bg-card p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Activity feed</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-1">
          {events.map((event) => {
            const meta = TYPE_META[event.type];
            return (
              <li key={event.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.bg, meta.color)}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium capitalize">{event.action.replace(/_/g, " ")}</span>
                    {event.targetName && <span className="text-muted-foreground"> · {event.targetName}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.actor} · {formatRelative(event.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
