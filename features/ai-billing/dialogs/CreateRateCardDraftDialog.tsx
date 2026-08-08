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
import { useCreateRateCardDraft } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

interface CreateRateCardDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRateCardDraftDialog({ open, onOpenChange }: CreateRateCardDraftDialogProps) {
  const router = useRouter();
  const createMutation = useCreateRateCardDraft();

  const [version, setVersion] = useState("");
  const [source, setSource] = useState("manual_admin");
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !source.trim() || !generatedAt.trim()) {
      toast.error("Version, source, and generated date are required.");
      return;
    }

    createMutation.mutate(
      {
        version: version.trim(),
        source: source.trim(),
        generatedAt: generatedAt.trim(),
        effectiveFrom: effectiveFrom.trim() || undefined,
        effectiveTo: effectiveTo.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success(`Draft rate card "${version.trim()}" created`);
          onOpenChange(false);
          setVersion("");
          const createdVersion = data?.version || version.trim();
          router.push(`/ai-billing/rate-cards/${encodeURIComponent(createdVersion)}`);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to create draft rate card");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create DRAFT Rate Card</DialogTitle>
          <DialogDescription>
            Create an empty DRAFT rate-card snapshot. Drafts can be edited and validated before publishing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Version *</label>
            <Input
              placeholder="e.g. 2026-08-v1"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source *</label>
            <Input
              placeholder="e.g. manual_admin or provider_spec"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Generated Date (YYYY-MM-DD) *</label>
            <Input
              type="date"
              value={generatedAt}
              onChange={(e) => setGeneratedAt(e.target.value)}
              required
            />
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

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <LoadingSpinner size="sm" /> : "Create Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
