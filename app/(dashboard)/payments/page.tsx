"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePayments } from "@/hooks/usePayments";
import { PaymentStatusBadge } from "@/features/payments/PaymentStatusBadge";
import { PaymentDetailsDialog } from "@/features/payments/PaymentDetailsDialog";
import type {
  AdminPaymentListItem,
  PaymentSortBy,
  PaymentStatus,
  SortOrder,
} from "@/types/payments";
import { formatDateTime, formatNumber } from "@/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

const SORT_OPTIONS: { value: PaymentSortBy; label: string }[] = [
  { value: "createdAt", label: "Created at" },
  { value: "updatedAt", label: "Updated at" },
  { value: "amount", label: "Amount" },
  { value: "paidAt", label: "Paid at" },
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useDebouncedValue(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [currency, setCurrency] = useState("");
  const [tokenPackageId, setTokenPackageId] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<PaymentSortBy | "">("");
  const [sortOrder, setSortOrder] = useState<SortOrder | "">("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const debouncedCurrency = useDebouncedValue(currency);
  const debouncedTokenPackageId = useDebouncedValue(tokenPackageId);
  const debouncedUserId = useDebouncedValue(userId);

  const currencyError = currency !== "" && !/^[A-Z]{3}$/.test(currency);
  const tokenPackageIdError =
    tokenPackageId !== "" && !/^[1-9]\d*$/.test(tokenPackageId);
  const userIdError = userId !== "" && !UUID_REGEX.test(userId);
  const dateRangeError =
    dateFrom !== "" && dateTo !== "" && new Date(dateFrom) > new Date(dateTo);

  const sentCurrency = /^[A-Z]{3}$/.test(debouncedCurrency)
    ? debouncedCurrency
    : undefined;
  const sentTokenPackageId = /^[1-9]\d*$/.test(debouncedTokenPackageId)
    ? Number(debouncedTokenPackageId)
    : undefined;
  const sentUserId = UUID_REGEX.test(debouncedUserId)
    ? debouncedUserId
    : undefined;
  const sentDateFrom =
    dateFrom !== "" && !dateRangeError
      ? new Date(`${dateFrom}T00:00:00`).toISOString()
      : undefined;
  const sentDateTo =
    dateTo !== "" && !dateRangeError
      ? new Date(`${dateTo}T23:59:59.999`).toISOString()
      : undefined;

  const validationMessages: string[] = [];
  if (currencyError) {
    validationMessages.push("Currency must be exactly 3 uppercase letters.");
  }
  if (tokenPackageIdError) {
    validationMessages.push("Token package ID must be a positive integer.");
  }
  if (userIdError) {
    validationMessages.push("User ID must be a valid UUID.");
  }
  if (dateRangeError) {
    validationMessages.push("Date from must be on or before date to.");
  }

  const { data, isLoading, isFetching, error, refetch } = usePayments({
    page,
    limit,
    status: status || undefined,
    currency: sentCurrency,
    tokenPackageId: sentTokenPackageId,
    userId: sentUserId,
    dateFrom: sentDateFrom,
    dateTo: sentDateTo,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  });

  const columns = useMemo<ColumnDef<AdminPaymentListItem>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const { user } = row.original;
          return (
            <div>
              <p className="font-medium">{user.displayName ?? user.email}</p>
              {user.displayName && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "package",
        header: "Package",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.packageNameSnapshot}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.tokenPackage.code}
            </p>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <p className="font-medium">
            {row.original.amount} {row.original.currency}
          </p>
        ),
      },
      {
        id: "tokens",
        header: "Tokens",
        cell: ({ row }) => formatNumber(row.original.tokensSnapshot),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <PaymentStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: ({ row }) => row.original.provider,
      },
      {
        id: "paidAt",
        header: "Paid",
        cell: ({ row }) =>
          row.original.paidAt ? formatDateTime(row.original.paidAt) : "—",
      },
      {
        id: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPaymentId(row.original.id)}
          >
            <Eye className="size-4" />
            View
          </Button>
        ),
      },
    ],
    []
  );

  const hasFilters = !!(
    status ||
    currency ||
    tokenPackageId ||
    userId ||
    dateFrom ||
    dateTo ||
    sortBy ||
    sortOrder
  );

  const handleClearFilters = () => {
    setStatus("");
    setCurrency("");
    setTokenPackageId("");
    setUserId("");
    setDateFrom("");
    setDateTo("");
    setSortBy("");
    setSortOrder("");
    setPage(1);
  };

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Review payments made through the platform"
      >
        {data && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatNumber(data.pagination.total)}
            </span>
            total payments
          </span>
        )}
      </PageHeader>

      <FilterBar hasActiveFilters={hasFilters} onClear={handleClearFilters}>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            const value = v ?? "";
            setStatus(value === "all" ? "" : (value as PaymentStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[130px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value.toUpperCase());
            setPage(1);
          }}
          placeholder="Currency"
          maxLength={3}
          aria-invalid={currencyError}
          aria-label="Currency filter"
          className="h-9 w-24 rounded-xl uppercase"
        />

        <Input
          value={tokenPackageId}
          onChange={(e) => {
            setTokenPackageId(e.target.value.replace(/\D/g, ""));
            setPage(1);
          }}
          placeholder="Package ID"
          inputMode="numeric"
          aria-invalid={tokenPackageIdError}
          aria-label="Token package ID filter"
          className="h-9 w-28 rounded-xl"
        />

        <Input
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          placeholder="User UUID"
          aria-invalid={userIdError}
          aria-label="User ID filter"
          className="h-9 w-56 rounded-xl"
        />

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            aria-label="Date from"
            className="h-9 rounded-xl"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            aria-label="Date to"
            className="h-9 rounded-xl"
          />
        </div>

        <Select
          value={sortBy || "all"}
          onValueChange={(v) => {
            const value = v ?? "";
            setSortBy(value === "all" ? "" : (value as PaymentSortBy));
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[130px] rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sort by</SelectItem>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortOrder || "all"}
          onValueChange={(v) => {
            const value = v ?? "";
            setSortOrder(value === "all" ? "" : (value as SortOrder));
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[110px] rounded-xl">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Order</SelectItem>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {validationMessages.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {validationMessages.join(" ")}
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Updating results...
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyTitle={hasFilters ? "No payments match your filters" : "No payments yet"}
        emptyDescription={
          hasFilters
            ? "Try adjusting or clearing your filters"
            : "Payments will appear here once they are made"
        }
      />

      {data && data.items.length > 0 && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      <PaymentDetailsDialog
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </div>
  );
}
