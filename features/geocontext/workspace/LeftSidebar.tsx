"use client";

import { memo, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Crosshair,
  FileUp,
  Filter,
  ListFilter,
  MapPin,
  MapPinPlus,
  Navigation,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pagination } from "@/components/shared/Pagination";
import { categoryMeta, GEO_STATUS_META, LOCATION_CATEGORIES, RISK_LEVELS } from "@/constants/geocontext";
import { useGeoWorkspace } from "../workspace-context";
import { cn } from "@/lib/utils";
import type { GeoFilters, GeoLocation } from "@/types/geocontext";

/**
 * Left rail of the GIS workspace: search, filters, category navigation,
 * the paginated location list, recent locations and quick actions.
 */
export const LeftSidebar = memo(function LeftSidebar() {
  const ws = useGeoWorkspace();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of ws.analytics?.byCategory ?? []) counts.set(entry.category, entry.count);
    return counts;
  }, [ws.analytics]);

  const recentLocations = useMemo(
    () =>
      ws.recentLocationIds
        .map((id) => ws.locations.find((l) => l.id === id))
        .filter((l): l is GeoLocation => Boolean(l))
        .slice(0, 8),
    [ws.recentLocationIds, ws.locations]
  );

  const goToLocation = (location: GeoLocation) => {
    ws.openLocation(location, "view");
    ws.flyToMap(location.lat, location.lng, 13);
    ws.pushRecentLocation(location.id);
    ws.setMobileView("panel");
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Search */}
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={ws.searchInput}
            onChange={(e) => ws.onSearchInputChange(e.target.value)}
            placeholder="Search places in Egypt…"
            className="h-10 rounded-xl pl-9 pr-8"
          />
          {ws.searchInput && (
            <button
              type="button"
              onClick={() => ws.onSearchInputChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
            ws.hasActiveFilters || filtersOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {ws.hasActiveFilters && <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{ws.hasActiveFilters ? "●" : ""}</span>}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            {ws.hasActiveFilters && (
              <button type="button" onClick={(e) => { e.stopPropagation(); ws.clearFilters(); }} className="rounded-full bg-muted px-1.5 py-0.5 hover:text-foreground">Reset</button>
            )}
            {filtersOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </span>
        </button>

        {filtersOpen && <SidebarFilters />}
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Categories */}
        <SidebarSection title="Categories" icon={<Filter className="size-3.5" />}>
          <div className="grid grid-cols-1 gap-0.5">
            <button
              type="button"
              onClick={() => ws.setFilter("category", "")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                !ws.filters.category ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ListFilter className="size-3.5" />
              <span className="flex-1">All categories</span>
            </button>
            {LOCATION_CATEGORIES.filter((c) => (categoryCounts.get(c.value) ?? 0) > 0 || ws.filters.category === c.value).map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => ws.setFilter("category", ws.filters.category === c.value ? "" : c.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                  ws.filters.category === c.value ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 truncate">{c.label}</span>
                <span className="text-[10px] tabular-nums">{categoryCounts.get(c.value) ?? 0}</span>
              </button>
            ))}
          </div>
        </SidebarSection>

        {/* Location list */}
        <SidebarSection title="Locations" icon={<MapPin className="size-3.5" />} count={ws.total}>
          {ws.isLocationsLoading ? (
            <div className="space-y-1.5 p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : ws.locations.length === 0 ? (
            <p className="px-1 py-3 text-center text-xs text-muted-foreground">No locations match the current filters.</p>
          ) : (
            <ul className="space-y-0.5">
              {ws.locations.map((location) => (
                <LocationRow key={location.id} location={location} onOpen={goToLocation} />
              ))}
            </ul>
          )}
          {ws.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                compact
                page={ws.page}
                totalPages={ws.totalPages}
                total={ws.total}
                limit={ws.limit}
                onPageChange={ws.setPage}
                onLimitChange={(l) => { ws.setLimit(l); ws.setPage(1); }}
              />
            </div>
          )}
        </SidebarSection>

        {/* Recent locations */}
        {recentLocations.length > 0 && (
          <SidebarSection title="Recent" icon={<Clock className="size-3.5" />}>
            <ul className="space-y-0.5">
              {recentLocations.map((location) => (
                <LocationRow key={location.id} location={location} onOpen={goToLocation} compact />
              ))}
            </ul>
          </SidebarSection>
        )}
      </div>

      {/* Quick actions */}
      <QuickActions />
    </aside>
  );
});

function SidebarFilters() {
  const ws = useGeoWorkspace();
  const setFilter = <K extends keyof GeoFilters>(key: K, value: GeoFilters[K]) => ws.setFilter(key, value);

  return (
    <div className="mt-2 space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-2.5">
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Governorate</span>
        <Select value={ws.filters.governorate || "all"} onValueChange={(v) => setFilter("governorate", v === "all" ? "" : v ?? "")}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs"><SelectValue placeholder="All governorates" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All governorates</SelectItem>
            {ws.governorateNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
        <Select value={ws.filters.status || "all"} onValueChange={(v) => setFilter("status", v === "all" ? "" : (v as GeoFilters["status"]))}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(GEO_STATUS_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</span>
        <Select value={ws.filters.risk || "all"} onValueChange={(v) => setFilter("risk", v === "all" ? "" : (v as GeoFilters["risk"]))}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs"><SelectValue placeholder="Any risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any risk</SelectItem>
            {RISK_LEVELS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>

      <label className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="size-3.5 text-amber-500" />
          With warnings
        </span>
        <Switch size="sm" checked={ws.filters.hasWarnings === true} onCheckedChange={(v) => setFilter("hasWarnings", v ? true : "")} />
      </label>
    </div>
  );
}

const LocationRow = memo(function LocationRow({
  location,
  onOpen,
  compact,
}: {
  location: GeoLocation;
  onOpen: (location: GeoLocation) => void;
  compact?: boolean;
}) {
  const ws = useGeoWorkspace();
  const meta = categoryMeta(location.category);
  const active = location.id === ws.selectedLocationId;
  const activeWarnings = location.warnings.filter((w) => w.active).length;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(location)}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
          active ? "bg-primary/10" : "hover:bg-muted/60"
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
          <Navigation className={cn("size-3.5 transition-transform", active && "text-primary")} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-xs font-medium", active ? "text-primary" : "text-foreground")}>
            {location.nameEn}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {location.city}, {location.governorate}
          </span>
        </span>
        {activeWarnings > 0 && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-2.5" />
            {activeWarnings}
          </span>
        )}
        <Crosshair className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      {compact && <span className="sr-only">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
    </li>
  );
});

function QuickActions() {
  const ws = useGeoWorkspace();
  const actions = [
    {
      key: "add",
      label: "Add location",
      icon: <MapPinPlus className="size-4" />,
      hidden: !ws.canEdit,
      onClick: () => { ws.setSection("map"); ws.setMobileView("map"); ws.openCreateLocation(); },
    },
    {
      key: "zone",
      label: "Draw restricted zone",
      icon: <ShieldAlert className="size-4" />,
      hidden: !ws.canEdit,
      onClick: () => { ws.setDrawMode("zone"); ws.setSection("map"); ws.setMobileView("map"); },
    },
    {
      key: "import",
      label: "Import GeoJSON",
      icon: <UploadCloud className="size-4" />,
      hidden: !ws.canEdit,
      onClick: () => ws.setSection("settings"),
    },
    {
      key: "export",
      label: "Export GeoJSON",
      icon: <FileUp className="size-4" />,
      onClick: () => void ws.handleExport(),
    },
  ].filter((a) => !a.hidden);

  return (
    <div className="border-t border-border/60 p-3">
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((action) => (
          <Button key={action.key} variant="outline" size="sm" className="justify-start gap-1.5 text-xs" onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-border/40 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {count !== undefined && <span className="tabular-nums">{count}</span>}
        <ChevronDown className={cn("size-3 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="px-2.5 pt-1">{children}</div>}
    </section>
  );
}
