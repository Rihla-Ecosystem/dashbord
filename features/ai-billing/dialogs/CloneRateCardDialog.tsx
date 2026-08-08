"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCloneRateCard } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

interface CloneRateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceVersion: string;
}

export function CloneRateCardDialog({
  open,
  onOpenChange,
  sourceVersion,
}: CloneRateCardDialogProps) {
  const router = useRouter();
  const cloneMutation = useCloneRateCard();

  const [newVersion, setNewVersion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const version = newVersion.trim();

    if (!version) {
      toast.error("New version is required.");
      return;
    }

    cloneMutation.mutate(
      {
        sourceVersion,
        body: { newVersion: version },
      },
      {
        onSuccess: () => {
          toast.success(`Pricing draft "${version}" created from "${sourceVersion}"`);
          onOpenChange(false);
          setNewVersion("");
          router.push(`/ai-billing/rate-cards/${encodeURIComponent(version)}`);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to create pricing draft");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Prices</DialogTitle>
          <DialogDescription>
            Clone the active rate card into a new editable DRAFT with all current model pricing copied.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Current Version</label>
            <Input value={sourceVersion} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New Version *</label>
            <Input
              placeholder="e.g. 1.1.0"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cloneMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? <LoadingSpinner size="sm" /> : "Create Pricing Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
