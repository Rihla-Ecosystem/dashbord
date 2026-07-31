"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/shared/FilterBar";
import type { SortOrder } from "@/types/payments";
import type { WalletSortBy, WalletStatus } from "@/types/admin-token-wallet";

const STATUS_OPTIONS: { value: WalletStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
];

const SORT_OPTIONS: { value: WalletSortBy; label: string }[] = [
  { value: "tokenBalance", label: "Balance" },
  { value: "createdAt", label: "Created at" },
  { value: "updatedAt", label: "Updated at" },
];

interface TokenWalletFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchError: boolean;
  status: WalletStatus | "";
  onStatusChange: (value: WalletStatus | "") => void;
  sortBy: WalletSortBy | "";
  onSortByChange: (value: WalletSortBy | "") => void;
  sortOrder: SortOrder | "";
  onSortOrderChange: (value: SortOrder | "") => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function TokenWalletFilters({
  search,
  onSearchChange,
  searchError,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  hasActiveFilters,
  onClear,
}: TokenWalletFiltersProps) {
  return (
    <FilterBar hasActiveFilters={hasActiveFilters} onClear={onClear}>
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or ID"
        maxLength={110}
        aria-invalid={searchError}
        aria-label="Search token wallets"
        className="h-9 w-64 rounded-xl"
      />

      <Select
        value={status || "all"}
        onValueChange={(value) => {
          const v = value ?? "";
          onStatusChange(
            v === "all" || v === "ACTIVE" || v === "INACTIVE" || v === "BLOCKED"
              ? (v as WalletStatus | "")
              : ""
          );
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

      <Select
        value={sortBy || "all"}
        onValueChange={(value) => {
          const v = value ?? "";
          onSortByChange(
            v === "all" ||
              v === "tokenBalance" ||
              v === "createdAt" ||
              v === "updatedAt"
              ? (v as WalletSortBy | "")
              : ""
          );
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
        onValueChange={(value) => {
          const v = value ?? "";
          onSortOrderChange(v === "asc" || v === "desc" ? v : "");
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
  );
}
