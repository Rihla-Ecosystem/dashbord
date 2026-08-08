"use client";

import { Badge } from "@/components/ui/badge";
import type { RateCardStatus } from "@/types/ai-billing";
import { cn } from "@/lib/utils";

interface RateCardStatusBadgeProps {
  status: RateCardStatus | string;
  className?: string;
}

export function RateCardStatusBadge({ status, className }: RateCardStatusBadgeProps) {
  let badgeStyles = "bg-slate-500/10 text-slate-500 border-slate-500/20";

  if (status === "ACTIVE") {
    badgeStyles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium";
  } else if (status === "DRAFT") {
    badgeStyles = "bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium";
  } else if (status === "RETIRED") {
    badgeStyles = "bg-slate-500/10 text-slate-500 border-slate-500/20 font-medium";
  }

  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 text-xs capitalize", badgeStyles, className)}>
      {status}
    </Badge>
  );
}
