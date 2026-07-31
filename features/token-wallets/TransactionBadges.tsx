import { cn } from "@/lib/utils";
import type { AdjustmentOperation } from "@/types/admin-token-wallet";
import {
  formatTransactionTypeLabel,
  getTransactionTypeStyle,
} from "./transaction-format";

interface TransactionTypeBadgeProps {
  type: string;
  className?: string;
}

export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getTransactionTypeStyle(type),
        className
      )}
    >
      {formatTransactionTypeLabel(type)}
    </span>
  );
}

interface AdjustmentOperationBadgeProps {
  operation: AdjustmentOperation | undefined;
  className?: string;
}

export function AdjustmentOperationBadge({
  operation,
  className,
}: AdjustmentOperationBadgeProps) {
  if (operation === "CREDIT") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          className
        )}
      >
        + CREDIT
      </span>
    );
  }
  if (operation === "DEBIT") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          className
        )}
      >
        − DEBIT
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-muted text-muted-foreground",
        className
      )}
    >
      Unknown operation
    </span>
  );
}
