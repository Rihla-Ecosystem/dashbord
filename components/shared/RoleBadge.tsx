import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/constants";
import type { UserRole } from "@/types";
import { cnRoleColor } from "@/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cnRoleColor(role),
        className
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

interface StatusBadgeProps {
  status: "active" | "inactive" | "banned" | "verified" | "pending";
  className?: string;
}

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  banned: "bg-red-500/10 text-red-600 dark:text-red-400",
  verified: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const statusLabels: Record<StatusBadgeProps["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  banned: "Banned",
  verified: "Verified",
  pending: "Pending",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
