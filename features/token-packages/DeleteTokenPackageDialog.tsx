"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDeleteTokenPackage } from "@/hooks/useTokenPackages";
import type { AdminTokenPackage } from "@/types/token-packages";
import { formatNumber, getErrorMessage } from "@/utils";

interface DeleteTokenPackageDialogProps {
  pkg: AdminTokenPackage | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteTokenPackageDialog({
  pkg,
  onClose,
  onDeleted,
}: DeleteTokenPackageDialogProps) {
  const deletePackage = useDeleteTokenPackage();

  const handleConfirm = () => {
    if (!pkg || deletePackage.isPending) return;
    deletePackage.mutate(pkg.id, {
      onSuccess: () => {
        onDeleted?.();
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={!!pkg}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete package</DialogTitle>
          <DialogDescription>
            Delete &quot;{pkg?.name}&quot; ({pkg?.code})? This action permanently
            removes the package and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {pkg && pkg.paymentCount > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-600/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              This package has {formatNumber(pkg.paymentCount)} related{" "}
              {pkg.paymentCount === 1 ? "payment" : "payments"} and cannot be
              deleted. Deactivate it instead to hide it from the listing.
            </p>
          </div>
        )}

        {deletePackage.isError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{getErrorMessage(deletePackage.error)}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={deletePackage.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!!pkg?.paymentCount || deletePackage.isPending}
          >
            {deletePackage.isPending ? <LoadingSpinner size="sm" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
