"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTokenPackages } from "@/hooks/useTokenPackages";
import { TokenPackageStatusBadge } from "@/features/token-packages/TokenPackageStatusBadge";
import { TokenPackageStatusDialog } from "@/features/token-packages/TokenPackageStatusDialog";
import { DeleteTokenPackageDialog } from "@/features/token-packages/DeleteTokenPackageDialog";
import { TokenPackageFormDialog } from "@/features/token-packages/TokenPackageFormDialog";
import { TokenPackageDetailsDialog } from "@/features/token-packages/TokenPackageDetailsDialog";
import type {
  AdminTokenPackage,
  TokenPackageSortBy,
} from "@/types/token-packages";
import type { SortOrder } from "@/types/payments";
import { formatDateTime, formatNumber } from "@/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";

const STATUS_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const SORT_OPTIONS: { value: TokenPackageSortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "tokens", label: "Tokens" },
  { value: "sortOrder", label: "Sort order" },
  { value: "createdAt", label: "Created at" },
  { value: "updatedAt", label: "Updated at" },
];

const SORTABLE_FIELDS: TokenPackageSortBy[] = [
  "name",
  "price",
  "tokens",
  "sortOrder",
  "createdAt",
];

const MAX_SEARCH_LENGTH = 100;

function useDebouncedValue(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function TokenPackagesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<"true" | "false" | "">("");
  const [currency, setCurrency] = useState("");
  const [sortBy, setSortBy] = useState<TokenPackageSortBy | "">("");
  const [sortOrder, setSortOrder] = useState<SortOrder | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<AdminTokenPackage | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [statusPkg, setStatusPkg] = useState<AdminTokenPackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<AdminTokenPackage | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const searchError = search.length > MAX_SEARCH_LENGTH;
  const currencyError = currency !== "" && !/^[A-Z]{3}$/.test(currency);

  const sentSearch =
    debouncedSearch.length <= MAX_SEARCH_LENGTH
      ? debouncedSearch || undefined
      : undefined;
  const sentCurrency = /^[A-Z]{3}$/.test(currency) ? currency : undefined;

  const validationMessages: string[] = [];
  if (searchError) {
    validationMessages.push(
      `Search must be ${MAX_SEARCH_LENGTH} characters or fewer.`
    );
  }
  if (currencyError) {
    validationMessages.push("Currency must be exactly 3 uppercase letters.");
  }

  const { data, isLoading, isFetching, error, refetch } = useTokenPackages({
    page,
    limit,
    search: sentSearch,
    isActive: isActive || undefined,
    currency: sentCurrency,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  });

  const handlePackageDeleted = () => {
    if (data && data.items.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  const sorting: SortingState =
    sortBy && SORTABLE_FIELDS.includes(sortBy)
      ? [{ id: sortBy, desc: sortOrder === "desc" }]
      : [];

  const handleSortingChange = (next: SortingState) => {
    const sort = next[0];
    if (!sort) {
      setSortBy("");
      setSortOrder("");
    } else {
      setSortBy(sort.id as TokenPackageSortBy);
      setSortOrder(sort.desc ? "desc" : "asc");
    }
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AdminTokenPackage>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <p className="font-medium">{row.original.name}</p>
        ),
      },
      {
        id: "code",
        header: "Code",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.code}</span>
        ),
      },
      {
        id: "description",
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => (
          <p className="max-w-[220px] truncate text-muted-foreground">
            {row.original.description ?? "—"}
          </p>
        ),
      },
      {
        accessorKey: "tokens",
        header: "Tokens",
        cell: ({ row }) => formatNumber(row.original.tokens),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <p className="font-medium">
            {row.original.price} {row.original.currency}
          </p>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <TokenPackageStatusBadge isActive={row.original.isActive} />
        ),
      },
      {
        accessorKey: "sortOrder",
        header: "Order",
        cell: ({ row }) => formatNumber(row.original.sortOrder),
      },
      {
        id: "paymentCount",
        header: "Payments",
        enableSorting: false,
        cell: ({ row }) => formatNumber(row.original.paymentCount),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailsId(pkg.id)}>
                  <Eye className="size-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingPkg(pkg);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusPkg(pkg)}>
                  <Power className="size-4" />
                  {pkg.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeletePkg(pkg)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const hasFilters = !!(search || isActive || currency || sortBy || sortOrder);

  const handleClearFilters = () => {
    setSearch("");
    setIsActive("");
    setCurrency("");
    setSortBy("");
    setSortOrder("");
    setPage(1);
  };

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Token Packages"
        description="Manage the token packages sold on the platform"
      >
        {data && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatNumber(data.pagination.total)}
            </span>
            total packages
          </span>
        )}
        <Button
          className="rounded-xl"
          onClick={() => {
            setEditingPkg(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          New package
        </Button>
      </PageHeader>

      <FilterBar hasActiveFilters={hasFilters} onClear={handleClearFilters}>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search packages"
          maxLength={MAX_SEARCH_LENGTH + 10}
          aria-invalid={searchError}
          aria-label="Search token packages"
          className="h-9 w-56 rounded-xl"
        />

        <Select
          value={isActive || "all"}
          onValueChange={(v) => {
            const value = v ?? "";
            setIsActive(value === "all" ? "" : (value as "true" | "false"));
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

        <Select
          value={sortBy || "all"}
          onValueChange={(v) => {
            const value = v ?? "";
            setSortBy(value === "all" ? "" : (value as TokenPackageSortBy));
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
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
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
        sorting={sorting}
        onSortingChange={handleSortingChange}
        emptyTitle={
          hasFilters
            ? "No token packages match your filters"
            : "No token packages yet"
        }
        emptyDescription={
          hasFilters
            ? "Try adjusting or clearing your filters"
            : "Create your first token package to start selling"
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

      <TokenPackageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pkg={editingPkg}
      />

      <TokenPackageStatusDialog
        pkg={statusPkg}
        onClose={() => setStatusPkg(null)}
      />

      <DeleteTokenPackageDialog
        pkg={deletePkg}
        onClose={() => setDeletePkg(null)}
        onDeleted={handlePackageDeleted}
      />

      <TokenPackageDetailsDialog
        packageId={detailsId}
        onClose={() => setDetailsId(null)}
      />
    </div>
  );
}
