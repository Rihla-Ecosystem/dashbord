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
import { useRetireRateCard } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { RateCardSnapshotDetail } from "@/types/ai-billing";

interface RetireRateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: RateCardSnapshotDetail;
}

export function RetireRateCardDialog({
  open,
  onOpenChange,
  snapshot,
}: RetireRateCardDialogProps) {
  const retireMutation = useRetireRateCard();

  const [retiredAt] = useState(() => new Date().toISOString());
  const [effectiveTo, setEffectiveTo] = useState(() => new Date().toISOString().slice(0, 10));

  const handleRetire = (e: React.FormEvent) => {
    e.preventDefault();

    retireMutation.mutate(
      {
        version: snapshot.version,
        body: {
          retiredAt: retiredAt.trim() || undefined,
          effectiveTo: effectiveTo.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Rate card version "${snapshot.version}" retired successfully (RETIRED)`);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to retire rate card");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Confirm Retire Rate Card ({snapshot.version})</span>
          </DialogTitle>
          <DialogDescription>
            Retiring an ACTIVE rate card sets its status to <strong>RETIRED</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRetire} className="space-y-4 py-2">
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs space-y-1 text-destructive">
            <div className="font-semibold">Critical Billing Warning</div>
            <p>
              Retiring an applicable ACTIVE Rate Card without another applicable ACTIVE card can make AI billing unavailable for live provider requests.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Effective To Date (Close Window)</label>
            <Input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={retireMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={retireMutation.isPending}
            >
              {retireMutation.isPending ? <LoadingSpinner size="sm" /> : "Retire Rate Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
