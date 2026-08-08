"use client";

import React, { useMemo, useState } from "react";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBillingRecoveryQueue } from "@/hooks/useBillingRecovery";
import type {
  BillingRecoveryQueueQuery,
  BillingRecoveryQueueItem,
  TokenReservationStatus,
  AIBillingMetadataStatus,
  AIBillingRecoveryReasonCode,
} from "@/types/ai-billing";
import { formatDateTime } from "@/utils";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Info,
  Search,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// ---------------------------------------------------------------------------
// Status Badges (Local — not a global abstraction)
// ---------------------------------------------------------------------------

const RESERVATION_STATUS_STYLES: Record<TokenReservationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  RELEASED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function ReservationStatusBadge({ status }: { status: TokenReservationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

const METADATA_STATUS_STYLES: Record<AIBillingMetadataStatus, string> = {
  VALID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  MISSING: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  INVALID: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function MetadataStatusBadge({ status }: { status: AIBillingMetadataStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${METADATA_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

const REASON_CODE_STYLES: Record<AIBillingRecoveryReasonCode, string> = {
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PENDING_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  METADATA_MISSING: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  METADATA_INVALID: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  INTEGRITY_CONFLICT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function ReasonCodeBadge({ code }: { code: AIBillingRecoveryReasonCode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${REASON_CODE_STYLES[code] ?? "bg-gray-100 text-gray-800"}`}
    >
      {code.replace(/_/g, " ")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Expandable Row
// ---------------------------------------------------------------------------

function ExpandableDetails({ item }: { item: BillingRecoveryQueueItem }) {
  const [open, setOpen] = useState(false);

  const details = [
    { label: "Reservation ID", value: item.reservationId },
    { label: "Reference ID", value: item.referenceId },
    { label: "Wallet ID", value: item.walletId },
    { label: "Pricing Version", value: String(item.pricingVersion) },
    { label: "Requested Mode", value: item.requestedMode ?? "—" },
    { label: "Quote Applied Mode", value: item.quoteAppliedMode ?? "—" },
    { label: "Provider", value: item.provider ?? "—" },
    { label: "Model", value: item.model ?? "—" },
    { label: "Billing Currency", value: item.billingCurrency ?? "—" },
    { label: "Rate Card Version", value: item.rateCardVersion ?? "—" },
    { label: "Wallet Policy Version", value: item.walletPolicyVersion ?? "—" },
    { label: "Expired", value: item.isExpired ? "Yes" : "No" },
    { label: "Expires At", value: formatDateTime(item.expiresAt) },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {open ? "Hide details" : "Show details"}
      </button>
      {open && (
        <div className="mt-2 grid gap-1 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          {details.map(({ label, value }) => (
            <div key={label} className="flex gap-2 text-xs">
              <span className="font-medium text-muted-foreground">{label}:</span>
              <span className="font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Content
// ---------------------------------------------------------------------------

function RecoveryContent() {
  // ── Filter State ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [featureFilter, setFeatureFilter] = useState<string>("");

  const queryParams = useMemo<BillingRecoveryQueueQuery>(() => {
    const params: BillingRecoveryQueueQuery = { page, limit };
    if (statusFilter) params.status = statusFilter as TokenReservationStatus;
    if (featureFilter) params.feature = featureFilter;
    return params;
  }, [page, limit, statusFilter, featureFilter]);

  // ── Data Hook ───────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useBillingRecoveryQueue(queryParams);

  // ── Loading / Error ─────────────────────────────────────────────────────
  if (isLoading) return <PageLoader />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to load Billing Recovery Queue"
        message={error instanceof Error ? error.message : "Unknown error"}
        onRetry={refetch}
      />
    );
  }
  if (!data) return null;

  const { items, pagination, aggregate } = data;
  const totalPages = pagination.totalPages;

  return (
    <div className="space-y-6">
      {/* ── Read-Only Safety Banner ────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
        <Shield className="mt-0.5 size-4 shrink-0" />
        <div>
          <span className="font-medium">This queue is read-only.</span>{" "}
          Entries shown here may require reconciliation or recovery, but no manual
          settle, release, or reconcile actions are currently exposed by the Admin API.
          Contact the engineering team if manual intervention is needed.
        </div>
      </div>

      {/* ── Aggregate Summary ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Queue Entries
            </CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(aggregate.count)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reserved Tokens
            </CardTitle>
            <Info className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(aggregate.totalTokens)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Showing
            </CardTitle>
            <Search className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.length}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                of {formatNumber(pagination.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(!val || val === "ALL" ? "" : val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Input
                placeholder="Filter by feature…"
                value={featureFilter}
                onChange={(e) => {
                  setFeatureFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Queue Table ────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No recovery entries found
            </p>
            <p className="text-sm text-muted-foreground">
              {statusFilter || featureFilter
                ? "Try adjusting the filters."
                : "The billing recovery queue is empty."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recovery Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Reserved Tokens</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.reservationId}
                      className={item.isExpired ? "opacity-60" : ""}
                    >
                      <TableCell className="font-mono text-xs">
                        {item.userId.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.feature}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{item.source}</TableCell>
                      <TableCell>
                        <ReservationStatusBadge status={item.reservationStatus} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(item.reservedTokens)}
                      </TableCell>
                      <TableCell>
                        <MetadataStatusBadge status={item.metadataStatus} />
                      </TableCell>
                      <TableCell>
                        <ReasonCodeBadge code={item.reasonCode} />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {item.isExpired && (
                            <AlertTriangle className="size-3 text-red-500" />
                          )}
                          {formatDateTime(item.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ExpandableDetails item={item} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ──────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Export
// ---------------------------------------------------------------------------

export default function BillingRecoveryPage() {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <div className="space-y-6">
        <PageHeader
          title="Billing Recovery Queue"
          description="Read-only inspection of billing reservations requiring reconciliation"
        />
        <RecoveryContent />
      </div>
    </RoleGuard>
  );
}
