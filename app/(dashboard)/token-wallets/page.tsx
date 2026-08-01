"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Coins, Loader2 } from "lucide-react";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { formatNumber } from "@/utils";
import { useAdminTokenWallets } from "@/hooks/useAdminTokenWallets";
import type { AdminTokenWalletListItem, WalletSortBy, WalletStatus } from "@/types/admin-token-wallet";
import type { SortOrder } from "@/types/payments";
import { TokenWalletFilters } from "@/features/token-wallets/TokenWalletFilters";
import { TokenWalletTable } from "@/features/token-wallets/TokenWalletTable";
import { GrantBonusDialog } from "@/features/token-wallets/GrantBonusDialog";
import { AdjustTokensDialog } from "@/features/token-wallets/AdjustTokensDialog";

function TokenWalletsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [limit, setLimit] = useState(() => Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<WalletStatus | "">(() => { const value = searchParams.get("status"); return value === "ACTIVE" || value === "INACTIVE" || value === "BLOCKED" ? value : ""; });
  const [sortBy, setSortBy] = useState<WalletSortBy | "">(() => { const value = searchParams.get("sortBy"); return value === "tokenBalance" || value === "createdAt" || value === "updatedAt" ? value : ""; });
  const [sortOrder, setSortOrder] = useState<SortOrder | "">(() => searchParams.get("sortOrder") === "asc" ? "asc" : searchParams.get("sortOrder") === "desc" ? "desc" : "");
  const [bonusTarget, setBonusTarget] = useState<AdminTokenWalletListItem | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<AdminTokenWalletListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("page", String(page)); next.set("limit", String(limit));
    if (search) next.set("search", search);
    if (status) next.set("status", status);
    if (sortBy) next.set("sortBy", sortBy);
    if (sortOrder) next.set("sortOrder", sortOrder);
    const queryString = next.toString();
    if (queryString !== searchParams.toString()) router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [limit, page, pathname, router, search, searchParams, sortBy, sortOrder, status]);

  const query = useAdminTokenWallets({
    page, limit, search: debouncedSearch && debouncedSearch.length <= 100 ? debouncedSearch : undefined, status: status || undefined,
    sortBy: sortBy || undefined, sortOrder: sortOrder || undefined,
  });
  const hasFilters = Boolean(search || status || sortBy || sortOrder);
  const updateSearch = (value: string) => { setSearch(value); setPage(1); };
  const clear = () => { setSearch(""); setStatus(""); setSortBy(""); setSortOrder(""); setPage(1); };

  if (query.error && !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  return <div className="space-y-6">
    <PageHeader title="Token Wallets" description="Review balances and manage token movements.">
      {query.data && <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-sm text-muted-foreground"><Coins className="size-4" /><strong className="text-foreground">{formatNumber(query.data.pagination.total)}</strong> wallets</span>}
    </PageHeader>
    <TokenWalletFilters search={search} onSearchChange={updateSearch} searchError={search.length > 100} status={status} onStatusChange={(value) => { setStatus(value); setPage(1); }} sortBy={sortBy} onSortByChange={(value) => { setSortBy(value); setPage(1); }} sortOrder={sortOrder} onSortOrderChange={(value) => { setSortOrder(value); setPage(1); }} hasActiveFilters={hasFilters} onClear={clear} />
    {search.length > 100 && <p className="text-sm text-destructive">Search must be 100 characters or fewer.</p>}
    {query.isFetching && query.data && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Updating wallets…</p>}
    <TokenWalletTable data={query.data?.items ?? []} isLoading={query.isLoading} hasFilters={hasFilters} onGrantBonus={setBonusTarget} onAdjustTokens={setAdjustTarget} />
    {query.data && <Pagination page={page} totalPages={query.data.pagination.totalPages} total={query.data.pagination.total} limit={limit} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1); }} />}
    {bonusTarget && <GrantBonusDialog open onOpenChange={(open) => { if (!open) setBonusTarget(null); }} userId={bonusTarget.userId} userName={bonusTarget.user.displayName} currentBalance={bonusTarget.tokenBalance} walletStatus={bonusTarget.status} />}
    {adjustTarget && <AdjustTokensDialog open onOpenChange={(open) => { if (!open) setAdjustTarget(null); }} userId={adjustTarget.userId} userName={adjustTarget.user.displayName} userEmail={adjustTarget.user.email} currentBalance={adjustTarget.tokenBalance} walletStatus={adjustTarget.status} />}
  </div>;
}

export default function TokenWalletsPage() { return <RoleGuard roles={["ADMIN"]}><TokenWalletsContent /></RoleGuard>; }
