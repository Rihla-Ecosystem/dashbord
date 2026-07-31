import type { WalletStatus } from "@/types/admin-token-wallet";

export interface BadgeStyle {
  className: string;
}

const TYPE_LABELS: Record<string, string> = {
  GRANT: "Grant",
  CONSUME: "Consume",
  REFUND: "Refund",
  BONUS: "Bonus",
  ADJUSTMENT: "Adjustment",
};

const TYPE_STYLES: Record<string, string> = {
  GRANT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CONSUME: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  REFUND: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  BONUS: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  ADJUSTMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const SOURCE_LABELS: Record<string, string> = {
  CHAT: "Chat",
  IMAGE: "Image Analysis",
  FILE_UPLOAD: "File Upload",
  OCR: "OCR",
  VOICE: "Voice",
  PURCHASE: "Purchase",
  ADMIN: "Admin",
};

const WALLET_STATUS_LABELS: Record<WalletStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  BLOCKED: "Blocked",
};

const WALLET_STATUS_STYLES: Record<WalletStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground",
  BLOCKED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function formatTransactionTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? formatUnknownLabel(type);
}

export function getTransactionTypeStyle(type: string): string {
  return TYPE_STYLES[type] ?? "bg-muted text-muted-foreground";
}

export function formatTransactionSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? formatUnknownLabel(source);
}

function formatUnknownLabel(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim();
  if (!words) return "Unknown";
  return words.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatWalletStatusLabel(status: string): WalletStatus | null {
  return status === "ACTIVE" || status === "INACTIVE" || status === "BLOCKED"
    ? status
    : null;
}

export function getWalletStatusStyle(status: WalletStatus | null): string {
  if (!status) return "bg-muted text-muted-foreground";
  return WALLET_STATUS_STYLES[status];
}

export function formatWalletStatusText(status: WalletStatus | null): string {
  if (!status) return "Unknown";
  return WALLET_STATUS_LABELS[status];
}

export interface WalletStatusBadgeInfo {
  label: string;
  style: string;
}

export function getWalletStatusBadgeInfo(status: string): WalletStatusBadgeInfo {
  const normalized = formatWalletStatusLabel(status);
  return {
    label: formatWalletStatusText(normalized),
    style: getWalletStatusStyle(normalized),
  };
}
