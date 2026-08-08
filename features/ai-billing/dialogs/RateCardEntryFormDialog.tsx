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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateRateCardEntry, useUpdateRateCardEntry } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type {
  CachedInputAccounting,
  CreateRateCardEntryRequest,
  RateCardBillingUnit,
  RateCardEntry,
  RateCardEntryStatus,
  RateCardTier,
} from "@/types/ai-billing";
import { toast } from "sonner";

interface RateCardEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  entryToEdit?: RateCardEntry | null;
}

function EntryFormContent({
  version,
  entryToEdit,
  onClose,
}: {
  version: string;
  entryToEdit?: RateCardEntry | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(entryToEdit?.id);

  const createEntryMutation = useCreateRateCardEntry();
  const updateEntryMutation = useUpdateRateCardEntry();

  const isPending = createEntryMutation.isPending || updateEntryMutation.isPending;

  const [provider, setProvider] = useState(() => entryToEdit?.provider ?? "");
  const [model, setModel] = useState(() => entryToEdit?.model ?? "");
  const [aliases, setAliases] = useState(() =>
    Array.isArray(entryToEdit?.aliases) ? entryToEdit.aliases.join(", ") : ""
  );
  const [status, setStatus] = useState<RateCardEntryStatus>(
    () => entryToEdit?.status ?? "STABLE"
  );
  const [tier, setTier] = useState<RateCardTier>(
    () => entryToEdit?.tier ?? "standard"
  );
  const [billingUnit, setBillingUnit] = useState<RateCardBillingUnit>(
    () => entryToEdit?.billingUnit ?? "TOKEN"
  );

  // Token rates
  const [inputMicros, setInputMicros] = useState(
    () => entryToEdit?.tokenRates?.inputMicrosPerMillion?.toString() ?? ""
  );
  const [outputMicros, setOutputMicros] = useState(
    () => entryToEdit?.tokenRates?.outputMicrosPerMillion?.toString() ?? ""
  );
  const [cachedInputMicros, setCachedInputMicros] = useState(
    () => entryToEdit?.tokenRates?.cachedInputMicrosPerMillion?.toString() ?? ""
  );
  const [cachedOutputMicros, setCachedOutputMicros] = useState(
    () => entryToEdit?.tokenRates?.cachedOutputMicrosPerMillion?.toString() ?? ""
  );
  const [cachedInputAccounting, setCachedInputAccounting] = useState<CachedInputAccounting | "">(
    () => entryToEdit?.cachedInputAccounting ?? ""
  );

  // Non-token rate
  const [perUnitMicros, setPerUnitMicros] = useState(
    () => entryToEdit?.perUnitMicros?.toString() ?? ""
  );

  // Modality & TTS
  const [audioInputMicros, setAudioInputMicros] = useState(
    () => entryToEdit?.modalityRates?.audioInputMicrosPerMillion?.toString() ?? ""
  );
  const [audioOutputMicros, setAudioOutputMicros] = useState(
    () => entryToEdit?.tts?.audioOutputMicrosPerMillion?.toString() ?? ""
  );
  const [tokensPerSecond, setTokensPerSecond] = useState(
    () => entryToEdit?.tts?.tokensPerSecond?.toString() ?? ""
  );

  // Window & Audit
  const [effectiveFrom, setEffectiveFrom] = useState(
    () => entryToEdit?.effectiveFrom ?? new Date().toISOString().slice(0, 10)
  );
  const [effectiveTo, setEffectiveTo] = useState(() => entryToEdit?.effectiveTo ?? "");
  const [inactive, setInactive] = useState(() => Boolean(entryToEdit?.inactive));
  const [adminReason, setAdminReason] = useState(
    () => entryToEdit?.adminReason ?? (isEditing ? "Admin configuration update" : "Admin entry creation")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider.trim() || !model.trim() || !effectiveFrom.trim() || !adminReason.trim()) {
      toast.error("Provider, model, effectiveFrom, and adminReason are required.");
      return;
    }

    const parsedAliases = aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const payload: CreateRateCardEntryRequest = {
      provider: provider.trim(),
      model: model.trim(),
      aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
      status,
      tier,
      billingUnit,
      effectiveFrom: effectiveFrom.trim(),
      effectiveTo: effectiveTo.trim() || undefined,
      inactive,
      adminReason: adminReason.trim(),
    };

    if (billingUnit === "TOKEN") {
      const hasTokenRates =
        inputMicros.trim() ||
        outputMicros.trim() ||
        cachedInputMicros.trim() ||
        cachedOutputMicros.trim();

      if (hasTokenRates) {
        payload.tokenRates = {
          inputMicrosPerMillion: inputMicros.trim() || undefined,
          outputMicrosPerMillion: outputMicros.trim() || undefined,
          cachedInputMicrosPerMillion: cachedInputMicros.trim() || undefined,
          cachedOutputMicrosPerMillion: cachedOutputMicros.trim() || undefined,
        };
      }

      if (cachedInputAccounting) {
        payload.cachedInputAccounting = cachedInputAccounting as CachedInputAccounting;
      }
    } else {
      if (perUnitMicros.trim()) {
        payload.perUnitMicros = perUnitMicros.trim();
      }
    }

    if (audioInputMicros.trim()) {
      payload.modalityRates = {
        audioInputMicrosPerMillion: audioInputMicros.trim(),
      };
    }

    if (audioOutputMicros.trim() || tokensPerSecond.trim()) {
      payload.tts = {
        audioOutputMicrosPerMillion: audioOutputMicros.trim() || undefined,
        tokensPerSecond: tokensPerSecond.trim() ? Number(tokensPerSecond.trim()) : undefined,
      };
    }

    if (isEditing && entryToEdit?.id) {
      updateEntryMutation.mutate(
        {
          version,
          entryId: entryToEdit.id,
          patch: payload,
        },
        {
          onSuccess: () => {
            toast.success(`Entry for model "${model.trim()}" updated successfully`);
            onClose();
          },
          onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(err.response?.data?.message || err.message || "Failed to update rate card entry");
          },
        }
      );
    } else {
      createEntryMutation.mutate(
        {
          version,
          entry: payload,
        },
        {
          onSuccess: () => {
            toast.success(`Entry for model "${model.trim()}" created successfully`);
            onClose();
          },
          onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(err.response?.data?.message || err.message || "Failed to create rate card entry");
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 text-sm">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Provider *</label>
          <Input
            placeholder="e.g. openai, google, anthropic"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Model *</label>
          <Input
            placeholder="e.g. gpt-4o, gemini-1.5-pro"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Billing Unit *</label>
          <Select
            value={billingUnit}
            onValueChange={(val) => setBillingUnit(val as RateCardBillingUnit)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Billing Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOKEN">TOKEN</SelectItem>
              <SelectItem value="IMAGE">IMAGE</SelectItem>
              <SelectItem value="SECOND">SECOND</SelectItem>
              <SelectItem value="MINUTE">MINUTE</SelectItem>
              <SelectItem value="CHARACTER">CHARACTER</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tier</label>
          <Select value={tier} onValueChange={(val) => setTier(val as RateCardTier)}>
            <SelectTrigger>
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">standard</SelectItem>
              <SelectItem value="batch">batch</SelectItem>
              <SelectItem value="priority">priority</SelectItem>
              <SelectItem value="fast_mode">fast_mode</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status *</label>
          <Select value={status} onValueChange={(val) => setStatus(val as RateCardEntryStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STABLE">STABLE</SelectItem>
              <SelectItem value="PREVIEW">PREVIEW</SelectItem>
              <SelectItem value="DEPRECATED">DEPRECATED</SelectItem>
              <SelectItem value="LIMITED_AVAILABILITY">LIMITED_AVAILABILITY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Aliases (comma-separated)</label>
        <Input
          placeholder="e.g. gpt-4o-2024-05-13, gpt-4o-latest"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
        />
      </div>

      {/* Conditional Pricing Rates */}
      {billingUnit === "TOKEN" ? (
        <div className="space-y-3 rounded-xl border p-3 bg-muted/20">
          <h4 className="text-xs font-semibold text-foreground">Token Rates (Micro-USD per 1M tokens)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Input Micros / 1M</label>
              <Input
                placeholder="e.g. 2500000 (= $2.50)"
                value={inputMicros}
                onChange={(e) => setInputMicros(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Output Micros / 1M</label>
              <Input
                placeholder="e.g. 10000000 (= $10.00)"
                value={outputMicros}
                onChange={(e) => setOutputMicros(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Cached Input Micros / 1M</label>
              <Input
                placeholder="e.g. 1250000 (= $1.25)"
                value={cachedInputMicros}
                onChange={(e) => setCachedInputMicros(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Cached Output Micros / 1M</label>
              <Input
                placeholder="e.g. 5000000 (= $5.00)"
                value={cachedOutputMicros}
                onChange={(e) => setCachedOutputMicros(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Cached Input Accounting</label>
            <Select
              value={cachedInputAccounting}
              onValueChange={(val) => setCachedInputAccounting(val as CachedInputAccounting)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select accounting rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISJOINT">DISJOINT (separate token count)</SelectItem>
                <SelectItem value="INCLUDED_IN_INPUT">INCLUDED_IN_INPUT (subset of prompt input)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border p-3 bg-muted/20">
          <h4 className="text-xs font-semibold text-foreground">Unit Pricing ({billingUnit})</h4>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Per Unit Micro-USD</label>
            <Input
              placeholder="e.g. 15000 (= $0.015 per image/second)"
              value={perUnitMicros}
              onChange={(e) => setPerUnitMicros(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Optional Modality & TTS */}
      <div className="space-y-2 rounded-xl border p-3 bg-muted/20">
        <h4 className="text-xs font-semibold text-foreground">Modality & TTS Overrides (Optional)</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Audio Input / 1M</label>
            <Input
              placeholder="Micros"
              value={audioInputMicros}
              onChange={(e) => setAudioInputMicros(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Audio Output / 1M</label>
            <Input
              placeholder="Micros"
              value={audioOutputMicros}
              onChange={(e) => setAudioOutputMicros(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Tokens / Second</label>
            <Input
              type="number"
              placeholder="e.g. 25"
              value={tokensPerSecond}
              onChange={(e) => setTokensPerSecond(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Window & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Effective From *</label>
          <Input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            required
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

      <div className="flex items-center justify-between rounded-xl border p-3">
        <div>
          <span className="text-xs font-medium text-foreground">Mark as Inactive</span>
          <p className="text-[11px] text-muted-foreground">Inactive entries are bypassed during rate lookup.</p>
        </div>
        <Switch checked={inactive} onCheckedChange={setInactive} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Admin Reason *</label>
        <Input
          placeholder="Audit log reason for this entry update"
          value={adminReason}
          onChange={(e) => setAdminReason(e.target.value)}
          required
        />
      </div>

      <DialogFooter className="pt-2 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoadingSpinner size="sm" /> : isEditing ? "Save Changes" : "Add Model"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RateCardEntryFormDialog({
  open,
  onOpenChange,
  version,
  entryToEdit,
}: RateCardEntryFormDialogProps) {
  const isEditing = Boolean(entryToEdit?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Model Price" : "Add Model"}</DialogTitle>
          <DialogDescription>
            Configure provider model pricing parameters for DRAFT version {version}.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EntryFormContent
            key={entryToEdit?.id ?? "new"}
            version={version}
            entryToEdit={entryToEdit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
