"use client";

import { ChevronDown, Download, ListChecks, PauseCircle, PlayCircle, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { toast } from "sonner";
import { LocationTable } from "../LocationTable";
import { GEO_STATUS_META, LOCATION_CATEGORIES, RECENT_WINDOWS, RISK_LEVELS } from "@/constants/geocontext";
import { useSetGeoLocationStatus } from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import { cn } from "@/lib/utils";
import type { GeoFilters, GeoLocation } from "@/types/geocontext";

const QUICK_FILTERS = [
  { label: "All", patch: {} },
  { label: "Published", patch: { status: "published" as const } },
  { label: "With warnings", patch: { hasWarnings: true } },
  { label: "High risk", patch: { risk: "high" as const } },
  { label: "Restricted", patch: { category: "restricted" as const } },
  { label: "Recently updated", patch: { updatedSince: "7d" as const } },
];

export function LocationsPanel() {
  const ws = useGeoWorkspace();

  const isQuickActive = (patch: Record<string, unknown>) =>
    Object.entries(patch).some(([k, v]) => (ws.filters as unknown as Record<string, unknown>)[k] === v);

  return (
    <div className="flex h-full flex-col">
      {ws.hasSelection && (
        <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="size-4 text-primary" />
            {ws.selectedIds.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => ws.handleBulkStatus("published")}>
              <PlayCircle className="size-4 text-emerald-500" />
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => ws.handleBulkStatus("unpublished")}>
              <PauseCircle className="size-4 text-amber-500" />
              Unpublish
            </Button>
            <Button size="sm" variant="outline" onClick={ws.handleBulkExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => ws.handleBulkStatus("draft")}>
              Set draft
            </Button>
            <Button size="sm" variant="destructive" onClick={ws.handleBulkDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => ws.setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <Button
          variant={ws.filtersOpen ? "secondary" : "outline"}
          size="sm"
          onClick={() => ws.setFiltersOpen(!ws.filtersOpen)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {ws.filtersOpen ? <ChevronDown className="size-3.5" /> : null}
        </Button>
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.label}
              type="button"
              onClick={() => ws.applyQuickFilter(qf.patch)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isQuickActive(qf.patch)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>
        {ws.hasActiveFilters && (
          <button
            type="button"
            onClick={ws.clearFilters}
            className="ml-auto flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Reset
          </button>
        )}
      </div>

      {ws.filtersOpen && (
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3">
          <FilterBar className="border-0 bg-transparent p-0" hasActiveFilters={ws.hasActiveFilters} onClear={ws.clearFilters}>
            <SearchBar value={ws.filters.search} onChange={(v) => ws.setFilter("search", v)} placeholder="Search locations..." className="max-w-none flex-1" />
            <Select value={ws.filters.category || "all"} onValueChange={(v) => ws.setFilter("category", v === "all" ? "" : (v as GeoFilters["category"]))}>
              <SelectTrigger className="h-9 w-40 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {LOCATION_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ws.filters.governorate || "all"} onValueChange={(v) => ws.setFilter("governorate", v === "all" ? "" : v ?? "")}>
              <SelectTrigger className="h-9 w-44 rounded-xl"><SelectValue placeholder="Governorate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All governorates</SelectItem>
                {ws.governorateNames.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ws.filters.status || "all"} onValueChange={(v) => ws.setFilter("status", v === "all" ? "" : (v as GeoFilters["status"]))}>
              <SelectTrigger className="h-9 w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(GEO_STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ws.filters.risk || "all"} onValueChange={(v) => ws.setFilter("risk", v === "all" ? "" : (v as GeoFilters["risk"]))}>
              <SelectTrigger className="h-9 w-36 rounded-xl"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any risk</SelectItem>
                {RISK_LEVELS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ws.filters.updatedSince || "all"} onValueChange={(v) => ws.setFilter("updatedSince", v === "all" ? "" : v ?? "")}>
              <SelectTrigger className="h-9 w-40 rounded-xl"><SelectValue placeholder="Updated" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                {RECENT_WINDOWS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {ws.locationsError ? (
          <ErrorState title="Failed to load locations" message={ws.locationsError.message} onRetry={() => ws.refetchLocations()} />
        ) : (
          <>
            <LocationTable
              locations={ws.locations}
              isLoading={ws.isLocationsLoading}
              selectedId={ws.selectedLocationId ?? undefined}
              sorting={ws.sorting}
              onSortingChange={ws.setSorting}
              onSelect={(location) => ws.openLocation(location, "view")}
              onEdit={(location) => ws.openLocation(location, "edit")}
              onDelete={(location) => ws.requestDelete({ kind: "location", name: location.nameEn, id: location.id })}
              onRowContextMenu={(location, e) =>
                ws.setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  items: [
                    {
                      key: "view",
                      label: "View on map",
                      icon: <EyeIcon />,
                      onSelect: () => ws.openLocation(location, "view"),
                    },
                    {
                      key: "edit",
                      label: "Edit",
                      icon: <EditIcon />,
                      disabled: !ws.canEdit,
                      onSelect: () => ws.openLocation(location, "edit"),
                    },
                    {
                      key: location.status === "published" ? "unpublish" : "publish",
                      label: location.status === "published" ? "Unpublish" : "Publish",
                      icon: location.status === "published" ? <PauseIcon /> : <PlayIcon />,
                      disabled: !ws.canEdit,
                      onSelect: () => ws.toggleLocationStatus(location),
                    },
                    { key: "divider", label: "", divider: true },
                    {
                      key: "delete",
                      label: "Delete",
                      icon: <TrashIcon />,
                      destructive: true,
                      disabled: !ws.canDelete,
                      onSelect: () => ws.requestDelete({ kind: "location", name: location.nameEn, id: location.id }),
                    },
                  ],
                })
              }
              renderPublishToggle={(location) => <PublishToggle location={location} />}
              canEdit={ws.canEdit}
              canDelete={ws.canDelete}
              selectedIds={ws.selectedIds}
              onSelectionChange={ws.setSelectedIds}
            />
            <Pagination
              page={ws.page}
              totalPages={ws.totalPages}
              total={ws.total}
              limit={ws.limit}
              onPageChange={ws.setPage}
              onLimitChange={(l) => { ws.setLimit(l); ws.setPage(1); }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PublishToggle({ location }: { location: GeoLocation }) {
  const statusMutation = useSetGeoLocationStatus(location.id);
  const isPublished = location.status === "published";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() =>
        statusMutation.mutate(isPublished ? "unpublished" : "published", {
          onSuccess: () => toast.success(`"${location.nameEn}" ${isPublished ? "unpublished" : "published"}`),
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
      disabled={statusMutation.isPending}
      title={isPublished ? "Unpublish" : "Publish"}
    >
      {isPublished ? <PauseCircle className="size-4 text-amber-500" /> : <PlayCircle className="size-4 text-emerald-500" />}
    </Button>
  );
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EditIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg>;
}
function PauseIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>;
}