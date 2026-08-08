"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowLeft,
  FileCheck,
  FileDown,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { RoleGuard } from "@/features/auth/role-guard";
import { DataTable } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RateCardStatusBadge } from "@/features/ai-billing/RateCardStatusBadge";
import { RateCardEntryFormDialog } from "@/features/ai-billing/dialogs/RateCardEntryFormDialog";
import { DeleteRateCardEntryDialog } from "@/features/ai-billing/dialogs/DeleteRateCardEntryDialog";
import { ImportRateCardEntriesDialog } from "@/features/ai-billing/dialogs/ImportRateCardEntriesDialog";
import { ValidateRateCardDraftDialog } from "@/features/ai-billing/dialogs/ValidateRateCardDraftDialog";
import { PublishRateCardDialog } from "@/features/ai-billing/dialogs/PublishRateCardDialog";
import { RetireRateCardDialog } from "@/features/ai-billing/dialogs/RetireRateCardDialog";
import { useRateCardDetail, useRateCards } from "@/hooks/useRateCards";
import type { RateCardEntry } from "@/types/ai-billing";
import { formatDateTime } from "@/utils";

interface PageProps {
  params: Promise<{ version: string }>;
}

function RateCardDetailContent({ version }: { version: string }) {
  const router = useRouter();
  const decodedVersion = decodeURIComponent(version);

  const { data: snapshot, isLoading, isError, error, refetch } = useRateCardDetail(decodedVersion);

  const { data: rateCards } = useRateCards({ page: 1, limit: 100 });
  const activeVersion = useMemo(
    () => rateCards?.items?.find((item) => item.status === "ACTIVE")?.version,
    [rateCards?.items]
  );

  // Dialog States
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RateCardEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<RateCardEntry | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);

  const isDraft = snapshot?.status === "DRAFT";
  const isActive = snapshot?.status === "ACTIVE";
  const isRetired = snapshot?.status === "RETIRED";

  const entries = snapshot?.entries ?? [];

  const columns = useMemo<ColumnDef<RateCardEntry>[]>(
    () => [
      {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.provider}</span>,
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.model}</div>
            {row.original.aliases && row.original.aliases.length > 0 && (
              <div className="text-[11px] text-muted-foreground">
                Aliases: {row.original.aliases.join(", ")}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "billingUnit",
        header: "Unit",
        cell: ({ row }) => <Badge variant="secondary" className="text-[11px]">{row.original.billingUnit}</Badge>,
      },
      {
        accessorKey: "tier",
        header: "Tier",
        cell: ({ row }) => (
          <span className="text-xs capitalize text-muted-foreground">{row.original.tier ?? "standard"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[11px]">
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "rates",
        header: "Rates",
        cell: ({ row }) => {
          const entry = row.original;
          if (entry.billingUnit === "TOKEN" && entry.tokenRates) {
            const inM = entry.tokenRates.inputMicrosPerMillion;
            const outM = entry.tokenRates.outputMicrosPerMillion;
            const cInM = entry.tokenRates.cachedInputMicrosPerMillion;
            return (
              <div className="text-xs space-y-0.5">
                {inM !== undefined && inM !== null && (
                  <div>
                    <span className="text-muted-foreground">Input:</span> {inM} micros ($
                    {(Number(inM) / 1_000_000).toFixed(4)}/1M)
                  </div>
                )}
                {outM !== undefined && outM !== null && (
                  <div>
                    <span className="text-muted-foreground">Output:</span> {outM} micros ($
                    {(Number(outM) / 1_000_000).toFixed(4)}/1M)
                  </div>
                )}
                {cInM !== undefined && cInM !== null && (
                  <div className="text-[11px] text-muted-foreground">
                    Cached In: {cInM} micros ({entry.cachedInputAccounting ?? "DISJOINT"})
                  </div>
                )}
              </div>
            );
          }

          if (entry.perUnitMicros !== undefined && entry.perUnitMicros !== null) {
            return (
              <div className="text-xs">
                <span className="text-muted-foreground">Per Unit:</span> {entry.perUnitMicros.toString()} micros ($
                {(Number(entry.perUnitMicros) / 1_000_000).toFixed(4)})
              </div>
            );
          }

          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: "inactive",
        header: "Active",
        cell: ({ row }) =>
          row.original.inactive ? (
            <Badge variant="destructive" className="text-[10px]">
              Inactive
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
              Active
            </Badge>
          ),
      },
      // Actions column ONLY rendered for DRAFT snapshots
      ...(isDraft
        ? [
            {
              id: "actions",
              header: "Actions",
              cell: ({ row }: { row: { original: RateCardEntry } }) => (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingEntry(row.original);
                      setEntryFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteEntry(row.original)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [isDraft]
  );

  if (isLoading) return <PageLoader />;

  if (isError || !snapshot) {
    return (
      <ErrorState
        title="Failed to load Rate Card details"
        message={(error as Error)?.message || `Could not retrieve rate card version "${decodedVersion}".`}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/ai-billing/rate-cards")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{snapshot.version}</h1>
              <RateCardStatusBadge status={snapshot.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Source: <span className="font-semibold text-foreground">{snapshot.source}</span>
            </p>
          </div>
        </div>

        {/* Action Controls strictly bound to status */}
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingEntry(null);
                  setEntryFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Model
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
              >
                <FileDown className="h-4 w-4 mr-1.5" />
                Import
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setValidateDialogOpen(true)}
              >
                <FileCheck className="h-4 w-4 mr-1.5" />
                Validate
              </Button>

              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setPublishDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Publish Rate Card
              </Button>
            </>
          )}

          {isActive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRetireDialogOpen(true)}
            >
              Retire Rate Card
            </Button>
          )}

          {isRetired && (
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              RETIRED (Read-Only)
            </Badge>
          )}
        </div>
      </div>

      {/* Snapshot Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Generated Date</span>
            <div className="text-sm font-semibold text-foreground">{snapshot.generatedAt ? snapshot.generatedAt.slice(0, 10) : "—"}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Effective Window</span>
            <div className="text-sm font-semibold text-foreground">
              {snapshot.effectiveFrom ?? "Unbounded"} {snapshot.effectiveTo ? `→ ${snapshot.effectiveTo}` : ""}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Published / Retired</span>
            <div className="text-sm font-semibold text-foreground">
              {snapshot.publishedAt ? formatDateTime(snapshot.publishedAt) : snapshot.retiredAt ? `Retired ${formatDateTime(snapshot.retiredAt)}` : "Not Published"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total Models</span>
            <div className="text-sm font-semibold text-foreground">{entries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Error Warning */}
      {snapshot.mappingError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 flex items-start space-x-3 text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-semibold">Engine Mapping Warning ({snapshot.mappingError.code}):</span>
            <p>{snapshot.mappingError.message}</p>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Model Pricing ({entries.length})
          </h2>
          {isDraft && (
            <span className="text-xs text-muted-foreground">
              DRAFT Mode: Entry edits, creations, imports, and deletions are allowed.
            </span>
          )}
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden">
          <DataTable
            columns={columns}
            data={entries}
            emptyTitle="No entries in this Rate Card"
            emptyDescription={isDraft ? "Click 'Add Model' or 'Import' to add model pricing to this draft snapshot." : "This rate card snapshot has no configured model pricing."}
          />
        </div>
      </div>

      {/* Dialogs */}
      {isDraft && (
        <>
          <RateCardEntryFormDialog
            open={entryFormOpen}
            onOpenChange={setEntryFormOpen}
            version={decodedVersion}
            entryToEdit={editingEntry}
          />

          <DeleteRateCardEntryDialog
            open={Boolean(deleteEntry)}
            onOpenChange={(open) => !open && setDeleteEntry(null)}
            version={decodedVersion}
            entry={deleteEntry}
          />

          <ImportRateCardEntriesDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            version={decodedVersion}
          />

          <ValidateRateCardDraftDialog
            open={validateDialogOpen}
            onOpenChange={setValidateDialogOpen}
            version={decodedVersion}
          />

          <PublishRateCardDialog
            open={publishDialogOpen}
            onOpenChange={setPublishDialogOpen}
            snapshot={snapshot}
            activeVersion={activeVersion}
          />
        </>
      )}

      {isActive && (
        <RetireRateCardDialog
          open={retireDialogOpen}
          onOpenChange={setRetireDialogOpen}
          snapshot={snapshot}
        />
      )}
    </div>
  );
}

export default function RateCardDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return (
    <RoleGuard roles={["ADMIN"]}>
      <RateCardDetailContent version={resolvedParams.version} />
    </RoleGuard>
  );
}
