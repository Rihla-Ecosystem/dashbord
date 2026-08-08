"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAiBillingOverview } from "@/hooks/useAiBillingOverview";
import { useShadowPricingSummary } from "@/hooks/useShadowPricing";
import { useRateCards } from "@/hooks/useRateCards";
import { formatDateTime } from "@/utils";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Cpu,
  DollarSign,
  Eye,
  Info,
  Shield,
  Tag,
  Users,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatCost(cost: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(cost);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LegacyCostNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <Info className="mt-0.5 size-4 shrink-0" />
      <div>
        <span className="font-medium">Estimated Operational Cost (Legacy Baseline).</span>{" "}
        These cost metrics are operational estimates derived from AI usage records. They
        are <strong>not</strong> authoritative Wallet settlements or actual provider
        billing amounts.
      </div>
    </div>
  );
}

function OverviewContent() {
  // ── Data Hooks ──────────────────────────────────────────────────────────
  const {
    data: usage,
    isLoading: isUsageLoading,
    isError: isUsageError,
    error: usageError,
    refetch: refetchUsage,
  } = useAiBillingOverview();

  const {
    data: shadowSummary,
    isLoading: isShadowLoading,
  } = useShadowPricingSummary();

  const {
    data: rateCardsResult,
    isLoading: isRateCardsLoading,
  } = useRateCards({ page: 1, limit: 5 });

  // ── Derived Data ────────────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    if (!usage) return [];
    return (usage.daily ?? usage.perDay ?? []).slice(-14);
  }, [usage]);


  // ── Loading / Error States ──────────────────────────────────────────────
  if (isUsageLoading) return <PageLoader />;
  if (isUsageError) {
    return (
      <ErrorState
        title="Failed to load AI Billing Overview"
        message={usageError instanceof Error ? usageError.message : "Unknown error"}
        onRetry={refetchUsage}
      />
    );
  }
  if (!usage) return null;

  const { summary, perModel, perUser, recent } = usage;

  // ── Max daily tokens for spark-bar scaling ──────────────────────────────
  const maxDailyTokens = Math.max(...dailyData.map((d) => d.totalTokens), 1);

  return (
    <div className="space-y-6">
      {/* Legacy cost safety banner */}
      <LegacyCostNotice />

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total AI Requests
            </CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalCalls)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tokens
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(summary.totalTokens)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              In: {formatTokens(summary.inputTokens)} · Out: {formatTokens(summary.outputTokens)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Operational Cost
            </CardTitle>
            <DollarSign className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCost(summary.cost)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Legacy baseline estimate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Models Used
            </CardTitle>
            <Cpu className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perModel?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Usage Sparkline Table ─────────────────────────────────── */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" /> Daily Usage (Last {dailyData.length} Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead className="w-32">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => {
                    const pct = Math.round((day.totalTokens / maxDailyTokens) * 100);
                    return (
                      <TableRow key={day.day}>
                        <TableCell className="font-medium">{day.day}</TableCell>
                        <TableCell className="text-right">{formatNumber(day.calls)}</TableCell>
                        <TableCell className="text-right">{formatTokens(day.inputTokens)}</TableCell>
                        <TableCell className="text-right">{formatTokens(day.outputTokens)}</TableCell>
                        <TableCell className="text-right">{formatTokens(day.totalTokens)}</TableCell>
                        <TableCell className="text-right text-amber-600 dark:text-amber-400">
                          {formatCost(day.cost)}
                        </TableCell>
                        <TableCell>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Usage by Model ─────────────────────────────────────────────── */}
      {perModel && perModel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4" /> Usage by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perModel.slice(0, 10).map((m, i) => (
                    <TableRow key={`${m.model}-${m.source}-${i}`}>
                      <TableCell className="font-medium font-mono text-xs">{m.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{m.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(m.calls)}</TableCell>
                      <TableCell className="text-right">{formatTokens(m.inputTokens)}</TableCell>
                      <TableCell className="text-right">{formatTokens(m.outputTokens)}</TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400">
                        {formatCost(m.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Usage by User ──────────────────────────────────────────────── */}
      {perUser && perUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" /> Usage by User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perUser.slice(0, 10).map((u) => (
                    <TableRow key={u.user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {u.user.displayName ?? "—"}
                          </div>
                          {u.user.email && (
                            <div className="text-xs text-muted-foreground">{u.user.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(u.calls)}</TableCell>
                      <TableCell className="text-right">{formatTokens(u.totalTokens)}</TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400">
                        {formatCost(u.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Shadow Pricing Snapshot ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4" /> Shadow Pricing Snapshot
          </CardTitle>
          <Link href="/ai-billing/shadow-pricing">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View Shadow Pricing <ArrowRight className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isShadowLoading ? (
            <p className="text-sm text-muted-foreground">Loading shadow pricing data…</p>
          ) : shadowSummary ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Observed Requests</p>
                <p className="text-lg font-bold">
                  {formatNumber(shadowSummary.requests.totalObserved)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Pricing Coverage</p>
                <p className="text-lg font-bold">
                  {shadowSummary.providerCalls.coverageAvailable && shadowSummary.providerCalls.coveragePercent
                    ? shadowSummary.providerCalls.coveragePercent
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Unpriced Requests</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {formatNumber(shadowSummary.requests.unpriced)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Zero Provider Calls</p>
                <p className="text-lg font-bold">
                  {formatNumber(shadowSummary.requests.zeroProviderCalls)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No shadow pricing data available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Rate Card Status ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="size-4" /> Rate Card Status
          </CardTitle>
          <Link href="/ai-billing/rate-cards">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Manage Rate Cards <ArrowRight className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isRateCardsLoading ? (
            <p className="text-sm text-muted-foreground">Loading rate card data…</p>
          ) : rateCardsResult && rateCardsResult.items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateCardsResult.items.map((rc) => (
                    <TableRow key={rc.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {rc.version}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rc.status === "ACTIVE"
                              ? "default"
                              : rc.status === "DRAFT"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {rc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rc.entryCount}</TableCell>
                      <TableCell className="text-xs">
                        {rc.effectiveFrom ? formatDateTime(rc.effectiveFrom) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rc.effectiveTo ? formatDateTime(rc.effectiveTo) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rate cards found.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Navigation ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/ai-billing/rate-cards" className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <Tag className="size-5 text-primary" />
              <div>
                <p className="font-medium">Rate Cards</p>
                <p className="text-xs text-muted-foreground">
                  Manage pricing rate cards
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/ai-billing/shadow-pricing" className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <Eye className="size-5 text-primary" />
              <div>
                <p className="font-medium">Shadow Pricing</p>
                <p className="text-xs text-muted-foreground">
                  Observe real-time pricing coverage
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/ai-billing/recovery" className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <Shield className="size-5 text-primary" />
              <div>
                <p className="font-medium">Billing Recovery</p>
                <p className="text-xs text-muted-foreground">
                  Inspect recovery queue
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────── */}
      {recent && recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" /> Recent AI Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.slice(0, 15).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {r.user?.displayName ?? r.user?.email ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.source}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.model ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTokens(r.totalTokens)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400">
                        {formatCost(r.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Export
// ---------------------------------------------------------------------------

export default function AiBillingOverviewPage() {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <div className="space-y-6">
        <PageHeader
          title="AI Billing Overview"
          description="Operational dashboard for AI usage, shadow pricing, and billing infrastructure"
        />
        <OverviewContent />
      </div>
    </RoleGuard>
  );
}
