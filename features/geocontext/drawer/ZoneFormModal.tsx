"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, PencilLine, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "../form-fields";
import { RESTRICTION_TYPES, RISK_LEVELS } from "@/constants/geocontext";
import {
  useCreateRestrictedZone,
  useUpdateRestrictedZone,
} from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import type {
  GeoCoordinates,
  RestrictionType,
  RestrictedZone,
  RiskLevel,
} from "@/types/geocontext";

function ZoneForm({
  zone,
  polygon,
  onCancel,
  onCreated,
}: {
  zone: RestrictedZone | null;
  polygon: GeoCoordinates[];
  onCancel: () => void;
  onCreated: (zone: RestrictedZone) => void;
}) {
  const isEdit = !!zone;
  const [name, setName] = useState(zone?.name ?? "");
  const [description, setDescription] = useState(zone?.description ?? "");
  const [restrictionType, setRestrictionType] = useState<RestrictionType>(zone?.restrictionType ?? "security");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(zone?.riskLevel ?? "medium");
  const [allowed, setAllowed] = useState((zone?.allowedActivities ?? []).join(", "));
  const [forbidden, setForbidden] = useState((zone?.forbiddenActivities ?? []).join(", "));
  const [active, setActive] = useState(zone?.active ?? true);
  const [error, setError] = useState<string | undefined>();

  const ws = useGeoWorkspace();
  const createMutation = useCreateRestrictedZone();
  const updateMutation = useUpdateRestrictedZone(zone?.id ?? "");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const poly = polygon?.length ? polygon : (zone?.polygon ?? []);
  const canSubmit = poly.length >= 3 && name.trim().length > 0;

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (poly.length < 3) {
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
      polygon: poly,
    };
    if (isEdit && zone) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Restricted zone updated");
          onCancel();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          toast.success("Restricted zone created");
          onCreated(created);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  const restrictionOptions: SelectOption[] = RESTRICTION_TYPES.map((r) => ({ value: r.value, label: r.label }));
  const riskOptions: SelectOption[] = RISK_LEVELS.map((r) => ({ value: r.value, label: r.label }));

  return (
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
            <p className="text-sm font-medium">Polygon ({poly.length} vertices)</p>
            <p className="text-xs text-muted-foreground">
              {poly.length >= 3 ? "Polygon captured from map" : "Draw a polygon on the map"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ws.setSection("map");
              ws.requestDraw();
            }}
          >
            <PencilLine className="size-4" />
            Draw
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

      <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isSubmitting || !canSubmit} title={!canSubmit ? "Draw a polygon and enter a name" : undefined}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : <Check className="size-4" />}
          {isEdit ? "Save zone" : "Create zone"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Centered Create / Edit modal for restricted zones. View details stay in the
 * right {@link ZoneDrawerForm} drawer.
 */
export function ZoneFormModal() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isCreate = target.kind === "create-zone";
  const isEdit = target.kind === "zone" && target.mode === "edit";
  const open = isCreate || isEdit;

  const zone = isEdit ? ws.zones.find((z) => z.id === target.zoneId) ?? null : null;
  const drawnPolygon = ws.draftGeometry?.parts.find((p) => p.type === "polygon")?.coords ?? null;
  const polygon = isCreate ? target.polygon : (drawnPolygon ?? zone?.polygon ?? []);

  const close = () => {
    if (isEdit && zone) ws.openZone(zone, "view");
    else ws.closeDrawer();
  };

  const riskColor =
    zone?.riskLevel === "extreme"
      ? "bg-gradient-to-br from-red-500 to-rose-600"
      : zone?.riskLevel === "high"
        ? "bg-gradient-to-br from-orange-500 to-red-500"
        : zone?.riskLevel === "medium"
          ? "bg-gradient-to-br from-amber-500 to-orange-500"
          : "bg-gradient-to-br from-emerald-500 to-teal-600";

  const onCreated = (created: RestrictedZone) => {
    ws.setDrawMode(null);
    ws.setDrawIntent(null);
    ws.openZone(created, "view");
  };

  return (
    <Modal open={open} onOpenChange={(next) => !next && close()}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow ${riskColor}`}>
              <ShieldAlert className="size-4" />
            </span>
            <div className="min-w-0">
              <ModalTitle>{isCreate ? "New restricted zone" : zone?.name ?? "Restricted zone"}</ModalTitle>
              <ModalDescription>
                {isCreate
                  ? "Draw the polygon on the map, configure restrictions, then save."
                  : zone?.description || "Update the restrictions for this zone."}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <ZoneForm
            key={`${isCreate ? "create" : `${zone?.id}-${zone?.polygon.length ?? 0}`}`}
            zone={zone}
            polygon={polygon}
            onCancel={() => {
              if (isEdit && zone) ws.openZone(zone, "view");
              else ws.closeDrawer();
            }}
            onCreated={onCreated}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}