"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit3, MapPinPlus, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RiskBadge } from "../badges";
import { RESTRICTION_TYPES } from "@/constants/geocontext";
import { useDeleteRestrictedZone } from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import { cn } from "@/lib/utils";
import type { RestrictedZone } from "@/types/geocontext";

function ZoneView({
  zone,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling,
}: {
  zone: RestrictedZone;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isToggling: boolean;
}) {
  const type = RESTRICTION_TYPES.find((t) => t.value === zone.restrictionType);
  return (
    <div className="space-y-4">
      {zone.description && <p className="text-sm text-muted-foreground">{zone.description}</p>}

      <div className="grid grid-cols-2 gap-3">
        <InfoCell label="Created" value={new Date(zone.createdAt).toLocaleDateString()} />
        <InfoCell label="Updated" value={new Date(zone.updatedAt).toLocaleDateString()} />
        <InfoCell label="Vertices" value={String(zone.polygon.length)} />
        <InfoCell label="Restriction" value={type?.label ?? zone.restrictionType.replace("_", " ")} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forbidden</p>
        <div className="flex flex-wrap gap-1.5">
          {zone.forbiddenActivities.length ? (
            zone.forbiddenActivities.map((a) => (
              <span key={a} className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                {a}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">None specified</span>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allowed</p>
        <div className="flex flex-wrap gap-1.5">
          {zone.allowedActivities.length ? (
            zone.allowedActivities.map((a) => (
              <span key={a} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {a}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">None specified</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div>
          <RiskBadge level={zone.riskLevel} />
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={onToggleActive} disabled={isToggling}>
                {zone.active ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" onClick={onEdit}>
                <Edit3 className="size-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

/**
 * View-details drawer for restricted zones. Create / Edit forms live in the
 * centered {@link ZoneFormModal}.
 */
export function ZoneDrawerForm() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isView = target.kind === "zone" && target.mode === "view";
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const zone = isView ? ws.zones.find((z) => z.id === target.zoneId) ?? null : null;

  const deleteMutation = useDeleteRestrictedZone();

  const close = () => ws.closeDrawer();

  const requestDelete = () => {
    if (!zone) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMutation.mutate(zone.id, {
      onSuccess: () => {
        toast.success("Restricted zone deleted");
        ws.closeDrawer();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const riskColor =
    zone?.riskLevel === "extreme"
      ? "bg-gradient-to-br from-red-500 to-rose-600"
      : zone?.riskLevel === "high"
        ? "bg-gradient-to-br from-orange-500 to-red-500"
        : zone?.riskLevel === "medium"
          ? "bg-gradient-to-br from-amber-500 to-orange-500"
          : "bg-gradient-to-br from-emerald-500 to-teal-600";

  return (
    <Sheet open={isView} onOpenChange={(next) => !next && close()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-[34rem]">
        {isView && zone && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow", riskColor)}>
                    <ShieldAlert className="size-4" />
                  </span>
                  <div>
                    <SheetTitle className="truncate text-base font-semibold">{zone.name}</SheetTitle>
                    <p className="text-xs capitalize text-muted-foreground">
                      {RESTRICTION_TYPES.find((t) => t.value === zone.restrictionType)?.label} · {zone.polygon.length} vertices
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close drawer">
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <ZoneView
                zone={zone}
                canEdit={ws.canEdit}
                canDelete={ws.canDelete}
                onEdit={() => ws.openZone(zone, "edit")}
                onDelete={requestDelete}
                onToggleActive={() => ws.toggleZoneActive(zone)}
                isToggling={ws.isZoneUpdating}
              />
            </div>

            <div className="flex items-center gap-2 border-t border-border/50 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
              <MapPinPlus className="size-3.5 shrink-0" />
              Use Edit to redraw the polygon or change restrictions.
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}