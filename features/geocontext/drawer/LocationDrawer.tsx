"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CategoryBadge, RiskBadge, StatusBadge } from "../badges";
import { LOCATION_TABS, type LocationTab } from "./tabs";
import { LocationViewTabs } from "./location-view";
import { useGeoLocation } from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { categoryMeta } from "@/constants/geocontext";
import { cn } from "@/lib/utils";
import type { ActivityEvent, GeoLocation } from "@/types/geocontext";

function LocationViewBody({
  location,
  tab,
  setTab,
  confirmingDelete,
  onDelete,
  onEdit,
  onClose,
  canEdit,
  canDelete,
  activityEvents,
}: {
  location: GeoLocation;
  tab: LocationTab;
  setTab: (tab: LocationTab) => void;
  confirmingDelete: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  activityEvents: ActivityEvent[];
}) {
  const meta = categoryMeta(location.category ?? "");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/50 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
            >
              <MapPin className="size-4" />
            </span>
            <SheetTitle className="truncate text-base font-semibold">{location.nameEn}</SheetTitle>
          </div>
          {location.nameAr && <p className="mt-0.5 truncate text-sm text-muted-foreground">{location.nameAr}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <StatusBadge status={location.status} />
            <CategoryBadge category={location.category} />
            <RiskBadge level={location.riskLevel} />
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close drawer">
          <X className="size-4" />
        </Button>
      </div>

      {/* tabs */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/50 bg-muted/20 px-3 py-1.5">
        {LOCATION_TABS.map((t) => {
          const Icon = t.icon;
          let count: number | null = null;
          if (t.id === "nearby") count = location.nearby.length;
          if (t.id === "media")
            count =
              location.images.length +
              location.documents.length +
              location.attachments.length +
              location.externalLinks.length +
              location.videos.filter((v) => v.url).length;
          if (t.id === "history") count = location.auditLog.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {count !== null && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1 text-[10px] font-bold",
                    tab === t.id ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <LocationViewTabs location={location} tab={tab} canEdit={canEdit} activityEvents={activityEvents} />
      </div>

      {/* footer */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-between gap-2">
          {canDelete ? (
            confirmingDelete ? (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="size-4" />
                Confirm delete
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button size="sm" onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * View-details drawer. Create and Edit forms live in the centered
 * {@link LocationFormModal} — this drawer only presents read-only details.
 */
export function LocationDrawer() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isView = target.kind === "location" && target.mode === "view";
  const [tab, setTab] = useState<LocationTab>("general");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const locationId = isView ? target.locationId : null;
  const detailQuery = useGeoLocation(locationId);
  const location = detailQuery.data ?? null;

  const close = () => ws.closeDrawer();

  const requestDelete = () => {
    if (!location) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    ws.requestDelete({ kind: "location", id: location.id, name: location.nameEn });
    setConfirmingDelete(false);
    ws.closeDrawer();
  };

  return (
    <Sheet open={isView} onOpenChange={(next) => !next && close()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-[46rem]"
      >
        {isView && location && (
          <LocationViewBody
            location={location}
            tab={tab}
            setTab={setTab}
            confirmingDelete={confirmingDelete}
            onDelete={requestDelete}
            onEdit={() => ws.openLocation(location, "edit")}
            onClose={close}
            canEdit={ws.canEdit}
            canDelete={ws.canDelete}
            activityEvents={ws.activity
              .filter((a) => a.targetId === location.id || a.targetName === location.nameEn)
              .slice(0, 25)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}