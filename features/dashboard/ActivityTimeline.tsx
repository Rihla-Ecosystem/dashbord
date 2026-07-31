"use client";

import { formatRelative } from "@/utils";
import type { AuditLog } from "@/types";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  logs: AuditLog[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (!logs.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No recent activity</p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
      {logs.map((log, i) => (
        <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
          <div
            className={cn(
              "relative z-10 mt-1 size-[22px] shrink-0 rounded-full border-2 border-background",
              i === 0 ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-snug">{log.action}</p>
            <p className="text-xs text-muted-foreground">
              {log.actorName ?? log.actorEmail ?? log.actorId}
              {log.targetType && ` · ${log.targetType}`}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(log.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
