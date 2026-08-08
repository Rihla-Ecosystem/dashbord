"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, PenLine, Plus } from "lucide-react";
import { RoleGuard } from "@/features/auth/role-guard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RateCardStatusBadge } from "@/features/ai-billing/RateCardStatusBadge";
import { CreateRateCardDraftDialog } from "@/features/ai-billing/dialogs/CreateRateCardDraftDialog";
import { CloneRateCardDialog } from "@/features/ai-billing/dialogs/CloneRateCardDialog";
import { useRateCards } from "@/hooks/useRateCards";
import type { RateCardSnapshotMetadata } from "@/types/ai-billing";
import { formatDate } from "@/utils";

function formatModelCount(card: RateCardSnapshotMetadata): string {
  return typeof card.entryCount === "number" ? `${card.entryCount} models` : "—";
}

function formatEffectiveWindow(card: RateCardSnapshotMetadata): string {
  const from = card.effectiveFrom ? formatDate(card.effectiveFrom) : "Unbounded";
  const to = card.effectiveTo ? formatDate(card.effectiveTo) : "Open";
  return `${from} → ${to}`;
}

function RateCardRow({
  card,
  onContinue,
  onView,
  onUpdate,
}: {
  card: RateCardSnapshotMetadata;
  onContinue?: (card: RateCardSnapshotMetadata) => void;
  onView?: (card: RateCardSnapshotMetadata) => void;
  onUpdate?: (card: RateCardSnapshotMetadata) => void;
}) {
  return (
    <Card className="rounded-2xl border bg-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{card.version}</span>
            <RateCardStatusBadge status={card.status} />
          </div>
          <div className="text-xs text-muted-foreground">
            {formatModelCount(card)} · Effective {formatEffectiveWindow(card)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onContinue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContinue(card)}
            >
              <PenLine className="h-4 w-4 mr-1.5" />
              Continue Editing
            </Button>
          )}
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(card)}>
              <Eye className="h-4 w-4 mr-1.5" />
              View
            </Button>
          )}
          {onUpdate && (
            <Button size="sm" onClick={() => onUpdate(card)}>
              <PenLine className="h-4 w-4 mr-1.5" />
              Update Prices
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RateCardsContent() {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({ page: 1, limit: 100 }),
    []
  );

  const { data, isLoading, isError, error, refetch } = useRateCards(queryParams);

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const activeCards = useMemo(
    () =>
      items
        .filter((card) => card.status === "ACTIVE")
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [items]
  );

  const draftCards = useMemo(
    () =>
      items
        .filter((card) => card.status === "DRAFT")
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    [items]
  );

  const retiredCards = useMemo(
    () =>
      items
        .filter((card) => card.status === "RETIRED")
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    [items]
  );

  const goToVersion = (version: string) =>
    router.push(`/ai-billing/rate-cards/${encodeURIComponent(version)}`);

  const viewCard = (card: RateCardSnapshotMetadata) => goToVersion(card.version);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Model Pricing"
        description="Manage active pricing, in-flight draft changes, and retired pricing history."
      >
        <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Rate Card
        </Button>
      </PageHeader>

      {isError ? (
        <ErrorState
          title="Failed to load Rate Cards"
          message={(error as Error)?.message || "An unexpected error occurred while fetching rate cards."}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-8">
          {/* Current Pricing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Pricing
              </h2>
              {!isLoading && <Badge variant="secondary" className="text-[10px]">{activeCards.length}</Badge>}
            </div>

            {isLoading ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">Loading current pricing…</CardContent>
              </Card>
            ) : activeCards.length === 0 ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No active rate card. Publish a DRAFT to activate current pricing.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeCards.map((card) => (
                  <RateCardRow
                    key={card.id}
                    card={card}
                    onView={viewCard}
                    onUpdate={() => setCloneSource(card.version)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Draft Changes */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Draft Changes
              </h2>
              {!isLoading && <Badge variant="secondary" className="text-[10px]">{draftCards.length}</Badge>}
            </div>

            {isLoading ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">Loading draft changes…</CardContent>
              </Card>
            ) : draftCards.length === 0 ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No drafts in progress. Click “Update Prices” on the active card to start a new pricing draft.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {draftCards.map((card) => (
                  <RateCardRow
                    key={card.id}
                    card={card}
                    onContinue={viewCard}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Pricing History */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pricing History
              </h2>
              {!isLoading && <Badge variant="secondary" className="text-[10px]">{retiredCards.length}</Badge>}
            </div>

            {isLoading ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">Loading pricing history…</CardContent>
              </Card>
            ) : retiredCards.length === 0 ? (
              <Card className="rounded-2xl border bg-card">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No retired rate cards yet. Retired versions appear here as read-only history.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {retiredCards.map((card) => (
                  <RateCardRow key={card.id} card={card} onView={viewCard} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Secondary: empty DRAFT flow */}
      <CreateRateCardDraftDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Primary: clone ACTIVE into a new DRAFT */}
      <CloneRateCardDialog
        open={Boolean(cloneSource)}
        onOpenChange={(open) => !open && setCloneSource(null)}
        sourceVersion={cloneSource ?? ""}
      />
    </div>
  );
}

export default function RateCardsPage() {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <RateCardsContent />
    </RoleGuard>
  );
}
