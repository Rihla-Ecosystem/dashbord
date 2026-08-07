"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationSource,
  NotificationType,
} from "@/types/notifications";

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-600 border-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  NORMAL: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  LOW: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

const TYPE_STYLES: Record<string, string> = {
  ERROR: "bg-red-500/15 text-red-600 border-red-500/30",
  WARNING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  SUCCESS: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  INFO: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SYSTEM: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

export function NotificationPriorityBadge({ priority }: { priority: NotificationPriority }) {
  return (
    <Badge variant="outline" className={cn("border", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.NORMAL)}>
      {priority}
    </Badge>
  );
}

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  return (
    <Badge variant="outline" className={cn("border", TYPE_STYLES[type] ?? TYPE_STYLES.INFO)}>
      {type}
    </Badge>
  );
}

export function NotificationSourceBadge({ source }: { source: NotificationSource }) {
  const styles: Record<string, string> = {
    EMERGENCY: "bg-red-500/15 text-red-600 border-red-500/30",
    CONTEXT: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    AI: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    ADMIN: "bg-teal-500/15 text-teal-600 border-teal-500/30",
    SYSTEM: "bg-slate-500/15 text-slate-500 border-slate-500/30",
  };
  return (
    <Badge variant="outline" className={cn("border", styles[source] ?? styles.SYSTEM)}>
      {source}
    </Badge>
  );
}

export function NotificationCategoryBadge({ category }: { category: NotificationCategory }) {
  const labels: Record<NotificationCategory, string> = {
    SAFETY: "Safety",
    SECURITY: "Security",
    WEATHER: "Weather",
    TRAFFIC: "Traffic",
    TOURIST: "Tourist",
    HISTORICAL: "Historical",
    EMERGENCY: "Emergency",
    RESTRICTED_AREA: "Restricted area",
    PHOTOGRAPHY: "Photography",
    RECOMMENDATION: "Recommendation",
    SYSTEM: "System",
  };
  return <Badge variant="outline">{labels[category] ?? category}</Badge>;
}