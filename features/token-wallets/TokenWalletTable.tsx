"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CirclePlus, Eye, Gift, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminTokenWalletListItem } from "@/types/admin-token-wallet";
import { formatDateTime, formatNumber } from "@/utils";
import { WalletStatusBadge } from "./WalletStatusBadge";
import { CopyIdButton } from "./CopyIdButton";

function AccountStatusBadge({ isActive, isBanned }: { isActive: boolean; isBanned: boolean }) {
  if (isBanned) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        Banned
      </span>
    );
  }
  if (!isActive) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      Active
    </span>
  );
}

interface TokenWalletTableProps {
  data: AdminTokenWalletListItem[];
  isLoading: boolean;
  hasFilters: boolean;
  onGrantBonus: (wallet: AdminTokenWalletListItem) => void;
  onAdjustTokens: (wallet: AdminTokenWalletListItem) => void;
}

export function TokenWalletTable({
  data,
  isLoading,
  hasFilters,
  onGrantBonus,
  onAdjustTokens,
}: TokenWalletTableProps) {
  const columns = useMemo<ColumnDef<AdminTokenWalletListItem>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.user.displayName || row.original.user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        ),
      },
      {
        id: "userId",
        header: "User ID",
        cell: ({ row }) => (
          <span className="flex items-center gap-1">
            <span className="max-w-[150px] truncate font-mono text-xs">
              {row.original.userId}
            </span>
            <CopyIdButton value={row.original.userId} label="Copy user ID" />
          </span>
        ),
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) => (
          <p className="font-semibold tabular-nums">
            {formatNumber(row.original.tokenBalance)}
          </p>
        ),
      },
      {
        id: "status",
        header: "Wallet",
        cell: ({ row }) => <WalletStatusBadge status={row.original.status} />,
      },
      {
        id: "account",
        header: "Account",
        cell: ({ row }) => (
          <AccountStatusBadge
            isActive={row.original.user.isActive}
            isBanned={row.original.user.isBanned}
          />
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const wallet = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem render={<Link href={`/token-wallets/${wallet.userId}`} />}>
                  <Eye className="size-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGrantBonus(wallet)}>
                  <Gift className="size-4" />
                  Grant bonus
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAdjustTokens(wallet)}>
                  <CirclePlus className="size-4" />
                  Adjust tokens
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onGrantBonus, onAdjustTokens]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle={
        hasFilters ? "No wallets match your filters" : "No token wallets yet"
      }
      emptyDescription={
        hasFilters
          ? "Try adjusting or clearing your filters"
          : "Wallets appear here once users receive their first tokens"
      }
    />
  );
}
