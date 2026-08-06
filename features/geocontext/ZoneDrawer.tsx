"use client";

import {
  Activity as ActivityIcon,
  Ban,
  Edit3,
  Landmark,
  Lock,
  ShieldAlert,
  Trash2,
  ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { RiskBadge, LayerPill } from "./badges";
import { RESTRICTION_TYPES } from "@/constants/geocontext";
import { formatDate, formatRelative } from "@/utils";
import type { RestrictedZone } from "@/types/geocontext";

interface ZoneDrawerProps {
  zone: RestrictedZone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isToggling?: boolean;
}

export function ZoneDrawer({
  zone,
  open,
  onOpenChange,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling,
}: ZoneDrawerProps) {
  const type = RESTRICTION_TYPES.find((t) => t.value === zone?.restrictionType);
  const riskColor =
    zone?.riskLevel === "extreme" ? "from-red-500 to-rose-600"
    : zone?.riskLevel === "high" ? "from-orange-500 to-red-500"
    : zone?.riskLevel === "medium" ? "from-amber-500 to-orange-500"
    : "from-emerald-500 to-teal-600";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md sm:gap-3">
        {zone && (
          <>
            <SheetHeader className="space-y-3">
              <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${riskColor} text-white shadow-lg`}>
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <SheetTitle className="text-lg">{zone.name}</SheetTitle>
                <SheetDescription className="capitalize">
                  {type?.label ?? zone.restrictionType.replace("_", " ")}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 px-4">
              <RiskBadge level={zone.riskLevel} />
              <LayerPill
                label={zone.active ? "Active" : "Inactive"}
                tone={zone.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}
              />
              {zone.source && <LayerPill label={zone.source} tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              {zone.description && <p className="text-sm text-muted-foreground">{zone.description}</p>}

              <div className="grid grid-cols-2 gap-3">
                <InfoCell icon={<Landmark className="size-4" />} label="Created" value={formatDate(zone.createdAt)} />
                <InfoCell icon={<ActivityIcon className="size-4" />} label="Updated" value={formatRelative(zone.updatedAt)} />
                <InfoCell icon={<Lock className="size-4" />} label="Vertices" value={String(zone.polygon.length)} />
                <InfoCell icon={<Ban className="size-4" />} label="Restriction" value={type?.label ?? "—"} />
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
            </div>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border/50 px-4 py-3 sm:gap-2">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={onToggleActive} disabled={isToggling}>
                    <ToggleLeft className="size-4" />
                    {zone.active ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={onEdit}>
                    <Edit3 className="size-4" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" onClick={onDelete}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}