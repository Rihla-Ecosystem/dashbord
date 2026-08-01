import { cn } from "@/lib/utils";

interface TokenPackageStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function TokenPackageStatusBadge({
  isActive,
  className,
}: TokenPackageStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
