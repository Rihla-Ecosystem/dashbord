import { Coins, TrendingUp, TrendingDown, Gift, ArrowDownLeft, ArrowUpRight, Scale, RotateCcw } from "lucide-react";
import type { TokenSummary } from "@/types/admin-token-wallet";
import { formatNumber } from "@/utils";
import { cn } from "@/lib/utils";

interface SummaryCardDef {
  key: keyof TokenSummary;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}

const CARD_DEFS: SummaryCardDef[] = [
  {
    key: "remainingTokens",
    label: "Remaining Tokens",
    hint: "Current wallet balance from the authoritative wallet record",
    icon: <Coins className="size-4" />,
    accent: "from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "purchasedTokens",
    label: "Purchased Tokens",
    hint: "Tokens granted through completed purchases",
    icon: <ArrowUpRight className="size-4" />,
    accent: "from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400",
  },
  {
    key: "bonusTokens",
    label: "Bonus Tokens",
    hint: "Tokens granted by admins as bonuses",
    icon: <Gift className="size-4" />,
    accent: "from-violet-500/10 to-violet-500/0 text-violet-600 dark:text-violet-400",
  },
  {
    key: "consumedTokens",
    label: "Consumed Tokens",
    hint: "Tokens consumed by feature usage",
    icon: <TrendingDown className="size-4" />,
    accent: "from-rose-500/10 to-rose-500/0 text-rose-600 dark:text-rose-400",
  },
  {
    key: "refundedTokens",
    label: "Refunded Tokens",
    hint: "Tokens returned through refunds",
    icon: <RotateCcw className="size-4" />,
    accent: "from-teal-500/10 to-teal-500/0 text-teal-600 dark:text-teal-400",
  },
  {
    key: "netConsumedTokens",
    label: "Net Consumed Tokens",
    hint: "Consumed tokens minus refunded tokens",
    icon: <Scale className="size-4" />,
    accent: "from-orange-500/10 to-orange-500/0 text-orange-600 dark:text-orange-400",
  },
  {
    key: "adjustmentCredits",
    label: "Adjustment Credits",
    hint: "Tokens added through admin CREDIT adjustments",
    icon: <ArrowUpRight className="size-4" />,
    accent: "from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "adjustmentDebits",
    label: "Adjustment Debits",
    hint: "Tokens removed through admin DEBIT adjustments",
    icon: <ArrowDownLeft className="size-4" />,
    accent: "from-rose-500/10 to-rose-500/0 text-rose-600 dark:text-rose-400",
  },
  {
    key: "netAdjustments",
    label: "Net Adjustments",
    hint: "Adjustment credits minus adjustment debits",
    icon: <TrendingUp className="size-4" />,
    accent: "from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400",
  },
];

interface WalletSummaryCardsProps {
  summary: TokenSummary;
}

export function WalletSummaryCards({ summary }: WalletSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {CARD_DEFS.map((def) => {
        const value = summary[def.key];
        const isNegative = typeof value === "number" && value < 0;
        return (
          <div
            key={def.key}
            title={def.hint}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className={cn("absolute inset-0 bg-gradient-to-b opacity-[0.07]", def.accent)} />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {def.label}
                </p>
                <span className={cn("rounded-lg p-1.5", def.accent)}>{def.icon}</span>
              </div>
              <p
                className={cn(
                  "text-xl font-bold tracking-tight",
                  isNegative && "text-rose-600 dark:text-rose-400"
                )}
              >
                {formatNumber(value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
