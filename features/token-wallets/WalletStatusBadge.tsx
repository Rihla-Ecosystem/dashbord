import { cn } from "@/lib/utils";
import { getWalletStatusBadgeInfo } from "./transaction-format";

interface WalletStatusBadgeProps {
  status: string;
  className?: string;
}

export function WalletStatusBadge({ status, className }: WalletStatusBadgeProps) {
  const { label, style } = getWalletStatusBadgeInfo(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
