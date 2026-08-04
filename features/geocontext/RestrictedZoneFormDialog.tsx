"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PencilLine, ShieldBan, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "./form-fields";
import { RESTRICTION_TYPES, RISK_LEVELS } from "@/constants/geocontext";
import { useCreateRestrictedZone, useDeleteRestrictedZone, useUpdateRestrictedZone } from "@/hooks/useGeocontext";
import { getErrorMessage } from "@/utils";
import type { GeoCoordinates, RestrictionType, RestrictedZone, RiskLevel } from "@/types/geocontext";

interface RestrictedZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: RestrictedZone | null;
  polygon: GeoCoordinates[];
  onRequestDraw: () => void;
}

export function RestrictedZoneFormDialog({ open, onOpenChange, zone, polygon, onRequestDraw }: RestrictedZoneFormDialogProps) {
  const isEdit = !!zone;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [restrictionType, setRestrictionType] = useState<RestrictionType>("security");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medium");
  const [allowed, setAllowed] = useState("");
  const [forbidden, setForbidden] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const createMutation = useCreateRestrictedZone();
  const updateMutation = useUpdateRestrictedZone(zone?.id ?? "");
  const deleteMutation = useDeleteRestrictedZone();
  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setName(zone?.name ?? "");
    setDescription(zone?.description ?? "");
    setRestrictionType(zone?.restrictionType ?? "security");
    setRiskLevel(zone?.riskLevel ?? "medium");
    setAllowed((zone?.allowedActivities ?? []).join(", "));
    setForbidden((zone?.forbiddenActivities ?? []).join(", "));
    setActive(zone?.active ?? true);
    setError(undefined);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const canSubmit = polygon.length >= 3 && name.trim().length > 0;

  const onSubmit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (polygon.length < 3) {
      setError("Draw a polygon on the map first");
      return;
    }
    setError(undefined);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      restrictionType,
      riskLevel,
      allowedActivities: allowed.split(",").map((s) => s.trim()).filter(Boolean),
      forbiddenActivities: forbidden.split(",").map((s) => s.trim()).filter(Boolean),
      active,
      polygon,
    };

    if (isEdit && zone) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Restricted zone updated");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Restricted zone created");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  const onDelete = () => {
    if (!zone) return;
    deleteMutation.mutate(zone.id, {
      onSuccess: () => {
        toast.success("Restricted zone deleted");
        onOpenChange(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const restrictionOptions: SelectOption[] = RESTRICTION_TYPES.map((r) => ({ value: r.value, label: r.label }));
  const riskOptions: SelectOption[] = RISK_LEVELS.map((r) => ({ value: r.value, label: r.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <ShieldBan className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit restricted zone" : "New restricted zone"}</DialogTitle>
              <DialogDescription>
                Define a polygon on the map and configure its restrictions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <TextInput label="Name" required value={name} onChange={setName} placeholder="e.g. Military perimeter" error={error && !name ? error : undefined} />
          <TextAreaField label="Description" value={description} onChange={setDescription} rows={3} />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Restriction type" value={restrictionType} onValueChange={(v) => setRestrictionType(v as RestrictionType)} options={restrictionOptions} />
            <SelectField label="Risk level" value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)} options={riskOptions} />
          </div>

          <TextAreaField label="Allowed activities (comma separated)" value={allowed} onChange={setAllowed} rows={2} />
          <TextAreaField label="Forbidden activities (comma separated)" value={forbidden} onChange={setForbidden} rows={2} />

          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Polygon ({polygon.length} vertices)</p>
                <p className="text-xs text-muted-foreground">
                  {polygon.length >= 3 ? "Polygon captured from map" : "Draw a polygon on the map"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onRequestDraw}>
                <PencilLine className="size-4" />
                {polygon.length >= 3 ? "Redraw" : "Draw"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Enforced by the AI service & mobile app</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            {isEdit && zone ? (
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={isSubmitting}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={isSubmitting || !canSubmit} title={!canSubmit ? "Draw a polygon and enter a name" : undefined}>
                {isSubmitting ? <LoadingSpinner size="sm" /> : isEdit ? "Save zone" : "Create zone"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
