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
import { useImportRateCardEntries } from "@/hooks/useRateCards";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Plus, Trash2 } from "lucide-react";
import type {
  CachedInputAccounting,
  CreateRateCardEntryRequest,
  RateCardBillingUnit,
  RateCardEntryStatus,
  RateCardTier,
} from "@/types/ai-billing";
import { toast } from "sonner";

interface ImportRateCardEntriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
}

export function ImportRateCardEntriesDialog({
  open,
  onOpenChange,
  version,
}: ImportRateCardEntriesDialogProps) {
  const importMutation = useImportRateCardEntries();

  const [source, setSource] = useState("provider_spec_import");
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [stagedEntries, setStagedEntries] = useState<CreateRateCardEntryRequest[]>([]);

  // Staging form fields
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [aliases, setAliases] = useState("");
  const [status, setStatus] = useState<RateCardEntryStatus>("STABLE");
  const [tier, setTier] = useState<RateCardTier>("standard");
  const [billingUnit, setBillingUnit] = useState<RateCardBillingUnit>("TOKEN");

  // Token rates
  const [inputMicros, setInputMicros] = useState("");
  const [outputMicros, setOutputMicros] = useState("");
  const [cachedInputMicros, setCachedInputMicros] = useState("");
  const [cachedOutputMicros, setCachedOutputMicros] = useState("");
  const [cachedInputAccounting, setCachedInputAccounting] = useState<CachedInputAccounting | "">("");

  // Non-token rates
  const [perUnitMicros, setPerUnitMicros] = useState("");

  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [adminReason, setAdminReason] = useState("Bulk import batch");

  const handleStageEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider.trim() || !model.trim() || !effectiveFrom.trim() || !adminReason.trim()) {
      toast.error("Provider, model, effectiveFrom, and adminReason are required to stage an entry.");
      return;
    }

    const parsedAliases = aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const newEntry: CreateRateCardEntryRequest = {
      provider: provider.trim(),
      model: model.trim(),
      aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
      status,
      tier,
      billingUnit,
      effectiveFrom: effectiveFrom.trim(),
      inactive: false,
      adminReason: adminReason.trim(),
    };

    if (billingUnit === "TOKEN") {
      const hasTokenRates =
        inputMicros.trim() ||
        outputMicros.trim() ||
        cachedInputMicros.trim() ||
        cachedOutputMicros.trim();

      if (hasTokenRates) {
        newEntry.tokenRates = {
          inputMicrosPerMillion: inputMicros.trim() || undefined,
          outputMicrosPerMillion: outputMicros.trim() || undefined,
          cachedInputMicrosPerMillion: cachedInputMicros.trim() || undefined,
          cachedOutputMicrosPerMillion: cachedOutputMicros.trim() || undefined,
        };
      }

      if (cachedInputAccounting) {
        newEntry.cachedInputAccounting = cachedInputAccounting as CachedInputAccounting;
      }
    } else {
      if (perUnitMicros.trim()) {
        newEntry.perUnitMicros = perUnitMicros.trim();
      }
    }

    setStagedEntries((prev) => [...prev, newEntry]);
    toast.success(`Staged entry for model "${model.trim()}"`);

    // Reset entry form fields
    setModel("");
    setAliases("");
    setInputMicros("");
    setOutputMicros("");
    setCachedInputMicros("");
    setCachedOutputMicros("");
    setPerUnitMicros("");
  };

  const handleRemoveStagedEntry = (index: number) => {
    setStagedEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportSubmit = () => {
    if (!source.trim() || !generatedAt.trim()) {
      toast.error("Source and generated date are required.");
      return;
    }

    if (stagedEntries.length === 0) {
      toast.error("Please stage at least one entry before submitting import.");
      return;
    }

    importMutation.mutate(
      {
        version,
        body: {
          source: source.trim(),
          generatedAt: generatedAt.trim(),
          entries: stagedEntries,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Successfully imported ${stagedEntries.length} entries into DRAFT ${version}`);
          setStagedEntries([]);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(err.response?.data?.message || err.message || "Failed to import rate card entries");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Rate Card Entries ({version})</DialogTitle>
          <DialogDescription>
            Build a batch of typed pricing entries and import them into DRAFT snapshot {version}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Import Source *</label>
              <Input
                placeholder="e.g. openai_official_spec"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Generated Date *</label>
              <Input
                type="date"
                value={generatedAt}
                onChange={(e) => setGeneratedAt(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Staging Entry Form */}
          <form onSubmit={handleStageEntry} className="space-y-3 p-4 rounded-xl border bg-card">
            <h4 className="text-xs font-semibold text-foreground">Add Typed Entry to Import Batch</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Provider *</label>
                <Input
                  placeholder="e.g. google, openai"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Model *</label>
                <Input
                  placeholder="e.g. gemini-1.5-pro"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Billing Unit *</label>
                <Select
                  value={billingUnit}
                  onValueChange={(val) => setBillingUnit(val as RateCardBillingUnit)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Unit" />
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

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Tier</label>
                <Select value={tier} onValueChange={(val) => setTier(val as RateCardTier)}>
                  <SelectTrigger className="h-8 text-xs">
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

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(val) => setStatus(val as RateCardEntryStatus)}>
                  <SelectTrigger className="h-8 text-xs">
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

            {billingUnit === "TOKEN" ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Input Micros / 1M (e.g. 2500000)"
                    value={inputMicros}
                    onChange={(e) => setInputMicros(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Output Micros / 1M (e.g. 10000000)"
                    value={outputMicros}
                    onChange={(e) => setOutputMicros(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Cached Input Micros / 1M"
                    value={cachedInputMicros}
                    onChange={(e) => setCachedInputMicros(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select
                    value={cachedInputAccounting}
                    onValueChange={(val) => setCachedInputAccounting(val as CachedInputAccounting)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Cached Accounting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISJOINT">DISJOINT</SelectItem>
                      <SelectItem value="INCLUDED_IN_INPUT">INCLUDED_IN_INPUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <Input
                placeholder="Per Unit Micros (e.g. 15000)"
                value={perUnitMicros}
                onChange={(e) => setPerUnitMicros(e.target.value)}
                className="h-8 text-xs"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="h-8 text-xs"
                required
              />
              <Input
                placeholder="Admin Reason *"
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <Button type="submit" variant="secondary" size="sm" className="w-full mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add Entry to Import Batch
            </Button>
          </form>

          {/* Staged Entries Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">
              Staged Import Entries Batch ({stagedEntries.length})
            </h4>

            {stagedEntries.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
                No entries staged yet. Fill out the form above and click &quot;Add Entry to Import Batch&quot;.
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="p-2">Provider</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Rates</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stagedEntries.map((entry, idx) => (
                      <tr key={`${entry.provider}-${entry.model}-${idx}`}>
                        <td className="p-2 font-medium">{entry.provider}</td>
                        <td className="p-2">{entry.model}</td>
                        <td className="p-2">{entry.billingUnit}</td>
                        <td className="p-2">
                          {entry.billingUnit === "TOKEN"
                            ? `In: ${entry.tokenRates?.inputMicrosPerMillion ?? "—"} / Out: ${entry.tokenRates?.outputMicrosPerMillion ?? "—"}`
                            : `${entry.perUnitMicros ?? "—"} micros`}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveStagedEntry(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={importMutation.isPending || stagedEntries.length === 0}
            >
              {importMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                `Import ${stagedEntries.length} Entries`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
