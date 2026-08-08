"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttemptRiskStatus, RequestCategory } from "@/types/ai-billing";

interface ShadowPricingCategoryBadgeProps {
  category: RequestCategory | string;
  className?: string;
}

export function ShadowPricingCategoryBadge({
  category,
  className,
}: ShadowPricingCategoryBadgeProps) {
  let badgeStyle = "bg-muted text-muted-foreground border-muted-foreground/20";

  switch (category) {
    case "FULLY_PRICED":
      badgeStyle =
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400";
      break;
    case "PARTIALLY_PRICED":
      badgeStyle =
        "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";
      break;
    case "UNPRICED":
      badgeStyle =
        "bg-destructive/10 text-destructive border-destructive/30";
      break;
    case "ZERO_PROVIDER_CALLS":
      badgeStyle =
        "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400";
      break;
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] font-medium tracking-wide", badgeStyle, className)}
    >
      {category}
    </Badge>
  );
}

interface AttemptRiskBadgeProps {
  status: AttemptRiskStatus | string;
  className?: string;
}

export function AttemptRiskBadge({
  status,
  className,
}: AttemptRiskBadgeProps) {
  let badgeStyle = "bg-muted text-muted-foreground border-muted-foreground/20";

  switch (status) {
    case "SAFE":
      badgeStyle =
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400";
      break;
    case "FAILED":
      badgeStyle =
        "bg-destructive/10 text-destructive border-destructive/30";
      break;
    case "INDETERMINATE":
      badgeStyle =
        "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";
      break;
    case "RETRY":
      badgeStyle =
        "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400";
      break;
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] font-medium tracking-wide", badgeStyle, className)}
    >
      {status}
    </Badge>
  );
}
