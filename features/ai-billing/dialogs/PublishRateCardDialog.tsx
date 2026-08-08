"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublishRateCard } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { RateCardSnapshotDetail } from "@/types/ai-billing";

interface PublishRateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: RateCardSnapshotDetail;
  activeVersion?: string;
}

export function PublishRateCardDialog({
  open,
  onOpenChange,
  snapshot,
  activeVersion,
}: PublishRateCardDialogProps) {
  const publishMutation = usePublishRateCard();

  const [effectiveFrom, setEffectiveFrom] = useState(snapshot.effectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState(snapshot.effectiveTo ?? "");
  const [replaceActiveVersion, setReplaceActiveVersion] = useState(activeVersion ?? "");

  // Default the replace target to the current ACTIVE rate card whenever the
  // dialog transitions to open (or the ACTIVE snapshot arrives while open).
  // Adjusting state during render from a tracked previous value is the React-
  // documented pattern: it never overwrites user input during ordinary
  // re-renders, and React re-renders immediately before committing.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setReplaceActiveVersion(activeVersion ?? "");
    }
  }

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    publishMutation.mutate(
      {
        version: snapshot.version,
        body: {
          effectiveFrom: effectiveFrom.trim() || undefined,
          effectiveTo: effectiveTo.trim() || undefined,
          replaceActiveVersion: replaceActiveVersion.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Rate card version "${snapshot.version}" published successfully (ACTIVE)`);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to publish rate card");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <span>Confirm Publish Rate Card ({snapshot.version})</span>
          </DialogTitle>
          <DialogDescription>
            Publishing makes this DRAFT rate card <strong>ACTIVE</strong>.
            The system uses database-authoritative billing, so publishing this rate card will directly affect live AI pricing valuations and user Wallet Billing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePublish} className="space-y-4 py-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs space-y-1">
            <div className="font-semibold text-amber-600 dark:text-amber-400">Billing Safety Notice</div>
            <p className="text-muted-foreground">
              Once published, this snapshot becomes immutable and active for rate calculation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Effective From</label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Effective To</label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {activeVersion ? "Replacing Current Pricing" : "Replace Active Version (Optional)"}
            </label>
            {activeVersion ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs flex items-center justify-between">
                <span className="font-semibold text-foreground">{activeVersion} (ACTIVE)</span>
                <span className="text-muted-foreground">will be replaced on publish</span>
              </div>
            ) : null}
            <Input
              placeholder="e.g. 2026-07-v2 (atomically retires target)"
              value={replaceActiveVersion}
              onChange={(e) => setReplaceActiveVersion(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={publishMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={publishMutation.isPending}>
              {publishMutation.isPending ? <LoadingSpinner size="sm" /> : "Publish Rate Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
