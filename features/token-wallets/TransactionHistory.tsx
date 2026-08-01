"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { useAdminTokenTransactions } from "@/hooks/useAdminTokenTransactions";
import type { AdminTokenTransactionItem, TokenTransactionSource, TokenTransactionType } from "@/types/admin-token-wallet";
import type { SortOrder } from "@/types/payments";
import { formatDateTime } from "@/utils";
import { formatSignedTokenAmount, readTransactionMetadata } from "./transaction-metadata";
import { TransactionTypeBadge, AdjustmentOperationBadge } from "./TransactionBadges";
import { formatTransactionSourceLabel } from "./transaction-format";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";

const TYPES: TokenTransactionType[] = ["GRANT", "CONSUME", "REFUND", "BONUS", "ADJUSTMENT"];
const SOURCES: TokenTransactionSource[] = ["CHAT", "IMAGE", "FILE_UPLOAD", "OCR", "VOICE", "PURCHASE", "ADMIN"];

export function TransactionHistory({ userId }: { userId: string }) {
  const [page, setPage] = useState(1); const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [type, setType] = useState<TokenTransactionType | "">(""); const [source, setSource] = useState<TokenTransactionSource | "">("");
  const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState(""); const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selected, setSelected] = useState<AdminTokenTransactionItem | null>(null);
  const dateError = Boolean(dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo));
  const dataQuery = useAdminTokenTransactions(userId, { page, limit, type: type || undefined, source: source || undefined, dateFrom: dateFrom && !dateError ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined, dateTo: dateTo && !dateError ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined, sortOrder });
  const columns: ColumnDef<AdminTokenTransactionItem>[] = [
    { id: "createdAt", header: "Date", cell: ({ row }) => formatDateTime(row.original.createdAt) },
    { id: "type", header: "Type", cell: ({ row }) => <div className="flex flex-wrap gap-1"><TransactionTypeBadge type={row.original.type} />{row.original.type === "ADJUSTMENT" && <AdjustmentOperationBadge operation={readTransactionMetadata(row.original.metadata).operation} />}</div> },
    { id: "source", header: "Source", cell: ({ row }) => formatTransactionSourceLabel(row.original.source) },
    { id: "tokens", header: "Tokens", cell: ({ row }) => { const operation = readTransactionMetadata(row.original.metadata).operation; return <span className="font-semibold tabular-nums">{formatSignedTokenAmount(row.original.tokens, row.original.type, operation)}</span>; } },
    { id: "reason", header: "Reason", cell: ({ row }) => <span className="block max-w-[180px] truncate" title={readTransactionMetadata(row.original.metadata).reason}>{readTransactionMetadata(row.original.metadata).reason ?? "—"}</span> },
    { id: "balances", header: "Balance", cell: ({ row }) => { const meta = readTransactionMetadata(row.original.metadata); return <span className="text-xs tabular-nums">{meta.previousBalance ?? "—"} → {meta.newBalance ?? "—"}</span>; } },
    { id: "actions", header: "", cell: ({ row }) => <Button variant="ghost" size="sm" onClick={() => setSelected(row.original)} aria-label="View technical transaction details"><Eye className="size-4" /> Details</Button> },
  ];
  const clear = () => { setType(""); setSource(""); setDateFrom(""); setDateTo(""); setSortOrder("desc"); setPage(1); };
  const filters = Boolean(type || source || dateFrom || dateTo || sortOrder !== "desc");
  if (dataQuery.error && !dataQuery.data) return <ErrorState onRetry={() => dataQuery.refetch()} />;
  return <section className="space-y-4"><div><h2 className="text-lg font-semibold">Token usage history</h2><p className="text-sm text-muted-foreground">All grants, usage, refunds, bonuses, and administrative adjustments.</p></div>
    <FilterBar hasActiveFilters={filters} onClear={clear}>
      <Select value={type || "all"} onValueChange={(value) => { setType(value === "all" ? "" : value as TokenTransactionType); setPage(1); }}><SelectTrigger className="h-9 w-[135px] rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={source || "all"} onValueChange={(value) => { setSource(value === "all" ? "" : value as TokenTransactionSource); setPage(1); }}><SelectTrigger className="h-9 w-[145px] rounded-xl"><SelectValue placeholder="Source" /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{SOURCES.map((value) => <SelectItem key={value} value={value}>{formatTransactionSourceLabel(value)}</SelectItem>)}</SelectContent></Select>
      <Input type="date" value={dateFrom} aria-label="Transactions from date" onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="h-9 w-[150px] rounded-xl" />
      <Input type="date" value={dateTo} aria-label="Transactions to date" onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="h-9 w-[150px] rounded-xl" />
      <Select value={sortOrder} onValueChange={(value) => { setSortOrder(value === "asc" ? "asc" : "desc"); setPage(1); }}><SelectTrigger className="h-9 w-[125px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Newest first</SelectItem><SelectItem value="asc">Oldest first</SelectItem></SelectContent></Select>
    </FilterBar>
    {dateError && <p className="text-sm text-destructive">Date from must be on or before date to.</p>}
    {dataQuery.isFetching && dataQuery.data && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Updating history…</p>}
    <DataTable columns={columns} data={dataQuery.data?.items ?? []} isLoading={dataQuery.isLoading} emptyTitle={filters ? "No transactions match your filters" : "No token transactions yet"} emptyDescription={filters ? "Try adjusting or clearing the filters." : "Token movements will appear here."} />
    {dataQuery.data && <Pagination page={page} totalPages={dataQuery.data.pagination.totalPages} total={dataQuery.data.pagination.total} limit={limit} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1); }} />}
    <TransactionDetailsDialog transaction={selected} onClose={() => setSelected(null)} />
  </section>;
}
