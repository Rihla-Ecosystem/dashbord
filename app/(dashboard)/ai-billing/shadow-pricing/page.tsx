"use client";

import React, { useMemo, useState } from "react";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageLoader, LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShadowPricingCategoryBadge,
  AttemptRiskBadge,
} from "@/features/ai-billing/ShadowPricingCategoryBadge";
import {
  useShadowPricingSummary,
  useShadowPricingObservations,
  useRecomputeShadowPricingPreview,
} from "@/hooks/useShadowPricing";
import type {
  RecomputePreviewResult,
  RequestCategory,
  ShadowPricingObservationsQuery,
} from "@/types/ai-billing";
import { formatDateTime } from "@/utils";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  Info,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

function ShadowPricingContent() {
  // Summary Query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useShadowPricingSummary();

  // Observations Filters & Query
  const [limit, setLimit] = useState<number>(50);
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RequestCategory | "ALL">("ALL");
  const [noProviderCallsFilter, setNoProviderCallsFilter] = useState<
    "ALL" | "ZERO_CALLS" | "REAL_CALLS"
  >("ALL");

  const queryParams = useMemo<ShadowPricingObservationsQuery>(() => {
    const params: ShadowPricingObservationsQuery = {
      limit: Number(limit) || 50,
    };
    if (sourceFilter.trim()) {
      params.source = sourceFilter.trim();
    }
    if (statusFilter !== "ALL") {
      params.status = statusFilter;
    }
    if (noProviderCallsFilter === "ZERO_CALLS") {
      params.noProviderCalls = true;
    } else if (noProviderCallsFilter === "REAL_CALLS") {
      params.noProviderCalls = false;
    }
    return params;
  }, [limit, sourceFilter, statusFilter, noProviderCallsFilter]);

  const {
    data: observationsResult,
    isLoading: isObservationsLoading,
    isError: isObservationsError,
    error: observationsError,
    refetch: refetchObservations,
  } = useShadowPricingObservations(queryParams);

  // Observations expandable row state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const toggleRowExpansion = (index: number) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Recompute Preview State & Mutation
  const recomputeMutation = useRecomputeShadowPricingPreview();
  const [recomputeFrom, setRecomputeFrom] = useState("");
  const [recomputeTo, setRecomputeTo] = useState("");
  const [recomputeLimit, setRecomputeLimit] = useState("100");
  const [recomputeResult, setRecomputeResult] = useState<RecomputePreviewResult | null>(null);

  const handleRecomputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recomputeFrom.trim() || !recomputeTo.trim()) {
      toast.error("Both From and To dates are required for recompute preview.");
      return;
    }

    if (recomputeFrom > recomputeTo) {
      toast.error("From date must be earlier than or equal to To date.");
      return;
    }

    const parsedLimit = recomputeLimit.trim() ? Number(recomputeLimit.trim()) : undefined;
    if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
      toast.error("Limit must be a positive integer.");
      return;
    }

    setRecomputeResult(null);
    recomputeMutation.mutate(
      {
        from: recomputeFrom.trim(),
        to: recomputeTo.trim(),
        limit: parsedLimit,
      },
      {
        onSuccess: (data) => {
          setRecomputeResult(data);
          toast.success("Recompute preview generated successfully");
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(
            e.response?.data?.message || e.message || "Failed to generate recompute preview"
          );
        },
      }
    );
  };

  if (isSummaryLoading) return <PageLoader />;

  if (isSummaryError || !summary) {
    return (
      <ErrorState
        title="Failed to load Shadow Pricing Summary"
        message={(summaryError as Error)?.message || "Could not retrieve shadow pricing metrics."}
        onRetry={refetchSummary}
      />
    );
  }

  const windowInfo = summary.window;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="AI Shadow Pricing Diagnostics"
        description="Diagnostic observation metrics and read-only pricing recomputation preview."
      />

      {/* Safety & Ephemeral Diagnostic Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Diagnostic Shadow Pricing Banner</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Shadow Pricing metrics are stored in <strong>IN_MEMORY</strong> storage, ephemeral, and bound to the active server process.
          They do <strong>NOT</strong> represent durable financial history or authoritative Wallet Billing charges.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-[11px] text-foreground font-mono">
          <div>
            <span className="text-muted-foreground">Storage:</span> {windowInfo.storage} (Ephemeral / Per-Process)
          </div>
          <div>
            <span className="text-muted-foreground">Buffer Capacity:</span> {windowInfo.capacity ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Retained Observations:</span> {windowInfo.retainedObservations ?? "—"}
          </div>
          {windowInfo.oldestObservedAt && (
            <div>
              <span className="text-muted-foreground">Oldest Window:</span> {formatDateTime(windowInfo.oldestObservedAt)}
            </div>
          )}
          {windowInfo.newestObservedAt && (
            <div>
              <span className="text-muted-foreground">Newest Window:</span> {formatDateTime(windowInfo.newestObservedAt)}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Requests Card */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Observed Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              {summary.requests.totalObserved.toLocaleString()}
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">
                Priced: {summary.requests.fullyPriced}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                Partial: {summary.requests.partiallyPriced}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                Unpriced: {summary.requests.unpriced}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 font-medium">
                Zero Calls: {summary.requests.zeroProviderCalls}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Provider Calls Card */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Real Provider Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              {summary.providerCalls.totalRealCalls.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">{summary.providerCalls.pricedCalls} priced</span>
              <span>/</span>
              <span className="text-destructive font-medium">{summary.providerCalls.unpricedCalls} unpriced</span>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Card */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pricing Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              {summary.providerCalls.coverageAvailable && summary.providerCalls.coveragePercent
                ? summary.providerCalls.coveragePercent
                : "N/A"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Percentage of real provider calls matched to rate card.
            </p>
          </CardContent>
        </Card>

        {/* Cost Card */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Observed Provider Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              ${Number(summary.pricedProviderCost?.usd || 0).toFixed(4)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Shadow-Priced Provider Cost (Not Wallet Charge).
            </p>
          </CardContent>
        </Card>

        {/* Attempt Risk Card */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Attempt Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              {summary.attempts.totalAttempts.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">attempts</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                Failed: {summary.attempts.failed}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                Indeterminate: {summary.attempts.indeterminate}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 font-medium">
                Retries: {summary.attempts.retryContainingRequests}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Breakdowns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Provider Table */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <Database className="h-4 w-4 text-primary" />
              <span>Breakdown by Provider</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!summary.byProvider || summary.byProvider.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No provider breakdown data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 font-medium">Provider</th>
                      <th className="p-3 font-medium text-right">Total Calls</th>
                      <th className="p-3 font-medium text-right">Priced</th>
                      <th className="p-3 font-medium text-right">Unpriced</th>
                      <th className="p-3 font-medium text-right">Observed Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.byProvider.map((p) => (
                      <tr key={p.provider} className="hover:bg-muted/20">
                        <td className="p-3 font-semibold text-foreground">{p.provider}</td>
                        <td className="p-3 text-right">{p.totalRealCalls}</td>
                        <td className="p-3 text-right text-emerald-600 font-medium">{p.pricedCalls}</td>
                        <td className="p-3 text-right text-destructive font-medium">{p.unpricedCalls}</td>
                        <td className="p-3 text-right font-mono font-medium">${Number(p.pricedProviderCost?.usd || 0).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpriced Reasons List */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Unpriced Reasons Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!summary.unpricedReasons || Object.keys(summary.unpricedReasons).length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No unpriced requests recorded in current window buffer.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(summary.unpricedReasons).map(([reason, count]) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-card text-xs"
                  >
                    <span className="font-mono font-medium text-foreground">{reason}</span>
                    <Badge variant="secondary" className="font-mono">
                      {count} {count === 1 ? "request" : "requests"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observations Section */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary" />
                <span>Observation Log Buffer</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Query recent ephemeral observation rows from process buffer.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchObservations()}
              disabled={isObservationsLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isObservationsLoading ? "animate-spin" : ""}`} />
              Refresh Buffer
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center space-x-1">
                <Filter className="h-3 w-3" />
                <span>Source</span>
              </label>
              <Input
                placeholder="Filter by source..."
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Category Status</label>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as RequestCategory | "ALL")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="FULLY_PRICED">FULLY_PRICED</SelectItem>
                  <SelectItem value="PARTIALLY_PRICED">PARTIALLY_PRICED</SelectItem>
                  <SelectItem value="UNPRICED">UNPRICED</SelectItem>
                  <SelectItem value="ZERO_PROVIDER_CALLS">ZERO_PROVIDER_CALLS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Provider Calls Mode</label>
              <Select
                value={noProviderCallsFilter}
                onValueChange={(val) =>
                  setNoProviderCallsFilter(val as "ALL" | "ZERO_CALLS" | "REAL_CALLS")
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Calls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="REAL_CALLS">Real Provider Calls Only</SelectItem>
                  <SelectItem value="ZERO_CALLS">Zero Provider Calls Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Buffer Limit</label>
              <Select
                value={String(limit)}
                onValueChange={(val) => setLimit(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="200">200 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isObservationsLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : isObservationsError ? (
            <div className="p-6">
              <ErrorState
                title="Failed to fetch observations"
                message={(observationsError as Error)?.message || "Could not retrieve observation logs."}
                onRetry={refetchObservations}
              />
            </div>
          ) : !observationsResult?.data || observationsResult.data.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No observation records match your filter criteria in current process buffer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b">
                  <tr>
                    <th className="p-3 w-8"></th>
                    <th className="p-3 font-medium">Observed At</th>
                    <th className="p-3 font-medium">Source</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Summary Status</th>
                    <th className="p-3 font-medium text-right">Provider Calls</th>
                    <th className="p-3 font-medium text-right">Observed Cost</th>
                    <th className="p-3 font-medium">Rate Card Version</th>
                    <th className="p-3 font-medium">Attempt Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {observationsResult.data.map((obs, idx) => {
                    const isExpanded = Boolean(expandedRows[idx]);
                    const hasReasons = obs.unpricedReasons && Object.keys(obs.unpricedReasons).length > 0;

                    return (
                      <React.Fragment key={`${obs.observedAt}-${idx}`}>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            {hasReasons && (
                              <button
                                type="button"
                                onClick={() => toggleRowExpansion(idx)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                            {formatDateTime(obs.observedAt)}
                          </td>
                          <td className="p-3 font-medium">{obs.source}</td>
                          <td className="p-3 whitespace-nowrap">
                            <ShadowPricingCategoryBadge category={obs.requestCategory} />
                            {obs.noProviderCalls && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                                (Zero-Call)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px]">{obs.engineSummaryStatus}</td>
                          <td className="p-3 text-right font-mono">
                            {obs.callCount} <span className="text-[10px] text-muted-foreground">({obs.pricedCallCount}p/{obs.unpricedCallCount}u)</span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">
                            ${Number(obs.pricedProviderCost?.usd || 0).toFixed(4)}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-muted-foreground">
                            {obs.rateCardVersion || "—"}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <AttemptRiskBadge status={obs.attemptRiskStatus} />
                          </td>
                        </tr>

                        {/* Expandable Unpriced Reasons Detail */}
                        {isExpanded && hasReasons && (
                          <tr className="bg-muted/30">
                            <td colSpan={9} className="p-3 border-t border-b">
                              <div className="pl-6 space-y-1.5">
                                <div className="text-[11px] font-semibold text-foreground flex items-center space-x-1">
                                  <Info className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Unpriced Reasons for this Observation:</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {Object.entries(obs.unpricedReasons).map(([r, count]) => (
                                    <span
                                      key={r}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-destructive/10 text-destructive border border-destructive/20"
                                    >
                                      {r}: {count}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Observations Meta Footer */}
          {observationsResult?.meta && (
            <div className="p-3 border-t bg-muted/20 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono gap-2">
              <div>
                Returned: <span className="font-semibold text-foreground">{observationsResult.meta.returned}</span> / Limit: {observationsResult.meta.limit} / Capacity: {observationsResult.meta.capacity}
              </div>
              <div>
                Storage: {observationsResult.meta.storage} | Ephemeral: true | Per-Process: true
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recompute Preview Section (Read-Only) */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4 border-b">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-base font-semibold">
                Recompute Shadow Pricing Preview
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                READ_ONLY_PREVIEW
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Simulate recomputation of shadow pricing against historical observations over a specified window.
              This operation is <strong>strictly read-only</strong> and will not mutate database records, active rate cards, or user wallet balances.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleRecomputeSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From Date *</label>
              <Input
                type="date"
                value={recomputeFrom}
                onChange={(e) => setRecomputeFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To Date *</label>
              <Input
                type="date"
                value={recomputeTo}
                onChange={(e) => setRecomputeTo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Row Limit (Optional)</label>
              <Input
                type="number"
                placeholder="Default: 100"
                value={recomputeLimit}
                onChange={(e) => setRecomputeLimit(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={recomputeMutation.isPending}>
              {recomputeMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5 fill-current" />
                  Run Recompute Preview
                </>
              )}
            </Button>
          </form>

          {/* Recompute Results Display */}
          {recomputeResult && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                  <span>Recompute Preview Results</span>
                </h4>
                <Badge variant="secondary" className="font-mono text-xs">
                  Mode: {recomputeResult.mode}
                </Badge>
              </div>

              {/* Selection, Rows & Shadow Comparisons Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Selection */}
                <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Window Selection</div>
                  <div className="font-mono text-foreground font-semibold">
                    {recomputeResult.selection.from} to {recomputeResult.selection.to}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono space-y-0.5 pt-1">
                    <div>Requested Limit: {recomputeResult.selection.requestedLimit}</div>
                    <div>Applied Limit: {recomputeResult.selection.appliedLimit}</div>
                  </div>
                </div>

                {/* Rows Scanned */}
                <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Rows Scanned</div>
                  <div className="font-mono text-xl font-bold text-foreground">
                    {recomputeResult.rows.scanned}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono space-y-0.5">
                    <div>Priced: <span className="text-emerald-600 font-semibold">{recomputeResult.rows.recomputedPriced}</span></div>
                    <div>Unpriced: <span className="text-amber-600 font-semibold">{recomputeResult.rows.recomputedUnpriced}</span></div>
                    <div>Skipped: <span className="text-muted-foreground font-semibold">{recomputeResult.rows.skipped}</span></div>
                  </div>
                </div>

                {/* Shadow Comparisons (ALL Counters) */}
                <div className="p-3 rounded-xl border bg-muted/20 space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
                  <div className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Shadow Comparisons</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-mono pt-0.5">
                    <div>Match: <span className="text-emerald-600 font-semibold">{recomputeResult.rows.shadowComparisons.match}</span></div>
                    <div>Mismatch: <span className="text-destructive font-semibold">{recomputeResult.rows.shadowComparisons.mismatch}</span></div>
                    <div>DB Not Found: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbNotFound}</span></div>
                    <div>DB Conflict: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbConflict}</span></div>
                    <div>DB Ver. Not Found: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbVersionNotFound}</span></div>
                    <div>DB Invalid: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbInvalid}</span></div>
                    <div>DB Error: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbError}</span></div>
                    <div>DB Pricing Error: <span className="font-semibold">{recomputeResult.rows.shadowComparisons.dbPricingError}</span></div>
                  </div>
                </div>

                {/* Cost */}
                <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Recomputed Provider Cost</div>
                  <div className="font-mono text-xl font-bold text-foreground">
                    ${Number(recomputeResult.pricedProviderCost?.usd || 0).toFixed(4)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Simulated total provider cost
                  </div>
                </div>
              </div>

              {/* Unpriced Reasons & Skip Reasons */}
              {((recomputeResult.unpricedReasons && Object.keys(recomputeResult.unpricedReasons).length > 0) ||
                (recomputeResult.skipReasons && Object.keys(recomputeResult.skipReasons).length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  {recomputeResult.unpricedReasons && Object.keys(recomputeResult.unpricedReasons).length > 0 && (
                    <div className="p-3 rounded-xl border bg-destructive/5 space-y-1.5">
                      <div className="font-semibold text-destructive text-xs">Unpriced Reasons:</div>
                      <div className="space-y-1 font-mono text-[11px]">
                        {Object.entries(recomputeResult.unpricedReasons).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-destructive/10 pb-0.5">
                            <span>{k}</span>
                            <span className="font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recomputeResult.skipReasons && Object.keys(recomputeResult.skipReasons).length > 0 && (
                    <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                      <div className="font-semibold text-foreground text-xs">Skip Reasons:</div>
                      <div className="space-y-1 font-mono text-[11px]">
                        {Object.entries(recomputeResult.skipReasons).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-muted/20 pb-0.5">
                            <span>{k}</span>
                            <span className="font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings if any */}
              {recomputeResult.warnings && recomputeResult.warnings.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1 text-amber-700 dark:text-amber-300">
                  <div className="font-semibold flex items-center space-x-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Recompute Preview Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {recomputeResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compact Row Results Table */}
              {recomputeResult.rowResults && recomputeResult.rowResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-foreground">
                    Recomputed Row Outcomes ({recomputeResult.rowResults.length})
                  </div>
                  <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground border-b">
                        <tr>
                          <th className="p-2 font-medium">ID</th>
                          <th className="p-2 font-medium">Outcome</th>
                          <th className="p-2 font-medium">Comparison Status</th>
                          <th className="p-2 font-medium font-mono text-right">Static Cost (Nano-USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recomputeResult.rowResults.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/20">
                            <td className="p-2 font-mono text-[11px] truncate max-w-32">{r.id}</td>
                            <td className="p-2 font-mono text-[11px]">{r.outcome}</td>
                            <td className="p-2">
                              {r.shadowComparison ? (
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-[10px] ${
                                    r.shadowComparison.status === "MATCH"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                      : "bg-destructive/10 text-destructive border-destructive/30"
                                  }`}
                                >
                                  {r.shadowComparison.status}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {r.shadowComparison?.staticTotalCostNanoUsd ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShadowPricingPage() {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <ShadowPricingContent />
    </RoleGuard>
  );
}
