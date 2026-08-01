"use client";

import { AlertCircle } from "lucide-react";
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
import { useUpdateTokenPackageStatus } from "@/hooks/useTokenPackages";
import type { AdminTokenPackage } from "@/types/token-packages";
import { getErrorMessage } from "@/utils";

interface TokenPackageStatusDialogProps {
  pkg: AdminTokenPackage | null;
  onClose: () => void;
}

export function TokenPackageStatusDialog({
  pkg,
  onClose,
}: TokenPackageStatusDialogProps) {
  const updateStatus = useUpdateTokenPackageStatus();
  const isActivating = !!pkg && !pkg.isActive;

  const handleConfirm = () => {
    if (!pkg || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: pkg.id, input: { isActive: !pkg.isActive } },
      { onSuccess: onClose }
    );
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
          <DialogTitle>
            {isActivating ? "Activate package" : "Deactivate package"}
          </DialogTitle>
          <DialogDescription>
            {isActivating
              ? `Activate "${pkg?.name}" (${pkg?.code})? It will become available through the public token package listing.`
              : `Deactivate "${pkg?.name}" (${pkg?.code})? It will be hidden from the public token package listing.`}
          </DialogDescription>
        </DialogHeader>

        {updateStatus.isError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{getErrorMessage(updateStatus.error)}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={updateStatus.isPending}>
            Cancel
          </Button>
          <Button
            variant={isActivating ? "default" : "secondary"}
            onClick={handleConfirm}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? (
              <LoadingSpinner size="sm" />
            ) : isActivating ? (
              "Activate"
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
