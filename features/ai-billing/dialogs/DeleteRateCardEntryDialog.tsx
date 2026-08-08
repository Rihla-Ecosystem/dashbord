"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteRateCardEntry } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { RateCardEntry } from "@/types/ai-billing";
import { toast } from "sonner";

interface DeleteRateCardEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  entry: RateCardEntry | null;
}

export function DeleteRateCardEntryDialog({
  open,
  onOpenChange,
  version,
  entry,
}: DeleteRateCardEntryDialogProps) {
  const deleteMutation = useDeleteRateCardEntry();

  if (!entry) return null;

  const handleDelete = () => {
    if (!entry.id) return;

    deleteMutation.mutate(
      { version, entryId: entry.id },
      {
        onSuccess: () => {
          toast.success(
            `Deleted entry for ${entry.provider} / ${entry.model}${entry.tier ? ` (${entry.tier})` : ""}`
          );
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to delete entry");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Delete Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this rate card entry from DRAFT version <strong>{version}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1 text-foreground">
          <div>
            <span className="font-semibold text-muted-foreground">Provider:</span> {entry.provider}
          </div>
          <div>
            <span className="font-semibold text-muted-foreground">Model:</span> {entry.model}
          </div>
          {entry.tier && (
            <div>
              <span className="font-semibold text-muted-foreground">Tier:</span> {entry.tier}
            </div>
          )}
          <div>
            <span className="font-semibold text-muted-foreground">Billing Unit:</span> {entry.billingUnit}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
