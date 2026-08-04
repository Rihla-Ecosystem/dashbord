"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  FileUp,
  Landmark,
  ListChecks,
  MapPinPlus,
  PauseCircle,
  PlayCircle,
  Plus,
  SlashSquare,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { DashboardCard } from "@/components/shared/DashboardCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { RoleGuard } from "@/features/auth/role-guard";
import {
  LOCATION_CATEGORIES,
  GOVERNORATES,
  RISK_LEVELS,
  RECENT_WINDOWS,
  GEO_STATUS_META,
} from "@/constants/geocontext";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { geocontextApi } from "@/services/geocontext";
import {
  useGeoLocations,
  useGeoRestrictedZones,
  useGeoBoundaries,
  useGeoAnalytics,
  useGeoActivity,
  useDeleteGeoLocation,
  useSetGeoLocationStatus,
  useDeleteRestrictedZone,
  useImportGeoJSON,
  useBulkGeoLocationStatus,
  useBulkDeleteGeoLocations,
} from "@/hooks/useGeocontext";
import dynamic from "next/dynamic";
import type { MapDrawMode } from "@/features/geocontext/GeoContextMap";
import { LocationFormDialog } from "@/features/geocontext/LocationFormDialog";
import { WarningFormDialog } from "@/features/geocontext/WarningFormDialog";
import { RestrictedZoneFormDialog } from "@/features/geocontext/RestrictedZoneFormDialog";
import { BoundaryFormDialog } from "@/features/geocontext/BoundaryFormDialog";
import { LocationDetailsPanel } from "@/features/geocontext/LocationDetailsPanel";
import { LocationTable } from "@/features/geocontext/LocationTable";
import { LayerPanel } from "@/features/geocontext/LayerPanel";
import { ActivityFeed } from "@/features/geocontext/ActivityFeed";
import { GeoStatsGrid, CategoryPieChart, SeverityBarChart, TopUpdatedList } from "@/features/geocontext/charts";
import {
  reverseGeocode,
  locationsToFeatureCollection,
  parseGeoJSONFile,
  downloadFile,
} from "@/features/geocontext/geoUtils";
import { makeHeatPoints } from "@/features/geocontext/map/heat-layer";
import { MAP_LAYERS, GEO_QUERY_KEYS } from "@/constants/geocontext";
import { getErrorMessage } from "@/utils";
import type { Boundary, GeoCoordinates, GeoFilters, GeoLocation, RestrictedZone } from "@/types/geocontext";
import { cn } from "@/lib/utils";

type LocationDialogState = {
  open: boolean;
  location: GeoLocation | null;
  initialCoords: { lat: number; lng: number } | null;
  reverse: Awaited<ReturnType<typeof reverseGeocode>> | null;
};

const allLayersOn = Object.fromEntries(MAP_LAYERS.map((l) => [l.id, true]));

const GeoContextMap = dynamic(() => import("@/features/geocontext/GeoContextMap").then((m) => m.GeoContextMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
      <MapPinPlus className="size-8 text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Loading map…</span>
    </div>
  ),
});

export default function GeoContextPage() {
  return (
    <RoleGuard roles={["ADMIN", "MODERATOR"]}>
      <GeoContextContent />
    </RoleGuard>
  );
}

function GeoContextContent() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(["ADMIN"]);
  const canEdit = hasRole(["ADMIN", "MODERATOR"]);
  const canDelete = isAdmin;

  const [filters, setFilters] = useState<GeoFilters>({
    search: "",
    category: "",
    governorate: "",
    status: "",
    risk: "",
    hasWarnings: "",
    updatedSince: "",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(allLayersOn);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<MapDrawMode>(null);

  const [locationDialog, setLocationDialog] = useState<LocationDialogState>({
    open: false,
    location: null,
    initialCoords: null,
    reverse: null,
  });
  const [warningDialog, setWarningDialog] = useState<{ open: boolean; locationId: string; locationName: string }>({
    open: false,
    locationId: "",
    locationName: "",
  });
  const [zoneDialog, setZoneDialog] = useState<{ open: boolean; zone: RestrictedZone | null; polygon: GeoCoordinates[] }>({
    open: false,
    zone: null,
    polygon: [],
  });
  const [boundaryDialog, setBoundaryDialog] = useState<{ open: boolean; polygon: GeoCoordinates[] }>({
    open: false,
    polygon: [],
  });
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "location" | "zone"; name: string; id: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationsQuery = useGeoLocations({ page, limit, filters });
  const zonesQuery = useGeoRestrictedZones();
  const boundariesQuery = useGeoBoundaries();
  const analyticsQuery = useGeoAnalytics();
  const activityQuery = useGeoActivity();

  const deleteLocationMutation = useDeleteGeoLocation();
  const deleteZoneMutation = useDeleteRestrictedZone();
  const importGeoJSONMutation = useImportGeoJSON();
  const bulkStatusMutation = useBulkGeoLocationStatus();
  const bulkDeleteMutation = useBulkDeleteGeoLocations();
  const queryClient = useQueryClient();

  const hasSelection = selectedIds.size > 0;

  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const selectedLocation = selectedLocationId
    ? (locations.find((l) => l.id === selectedLocationId) ?? null)
    : null;
  const selectedLocations = locations.filter((l) => selectedIds.has(l.id));

  const heatPoints = useMemo(() => {
    return makeHeatPoints(
      locations
        .filter((l) => l.safetyScore < 80)
        .map((l) => ({ lat: l.lat, lng: l.lng, intensity: Math.max(0, (80 - l.safetyScore) / 100) }))
    );
  }, [locations]);

  const toggleLayer = (id: string) =>
    setVisibleLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  const setFilter = <K extends keyof GeoFilters>(key: K, value: GeoFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.governorate || filters.status || filters.risk || filters.hasWarnings || filters.updatedSince
  );

  const clearFilters = () => {
    setFilters({ search: "", category: "", governorate: "", status: "", risk: "", hasWarnings: "", updatedSince: "" });
    setPage(1);
  };

  const openCreateLocation = () => setLocationDialog({ open: true, location: null, initialCoords: null, reverse: null });

  const handleMapClick = async (latlng: { lat: number; lng: number }) => {
    if (drawMode !== "location") return;
    setDrawMode(null);
    let reverse: Awaited<ReturnType<typeof reverseGeocode>> | null = null;
    try {
      reverse = await reverseGeocode(latlng.lat, latlng.lng);
    } catch {
      reverse = null;
    }
    setLocationDialog({ open: true, location: null, initialCoords: latlng, reverse });
  };

  const handlePolygonDrawn = (coords: GeoCoordinates[]) => {
    if (drawMode === "zone") {
      setDrawMode(null);
      setZoneDialog({ open: true, zone: null, polygon: coords });
    } else if (drawMode === "boundary") {
      setDrawMode(null);
      setBoundaryDialog({ open: true, polygon: coords });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "location") {
      deleteLocationMutation.mutate(deleteTarget.id, {
        onSuccess: () => {
          toast.success(`"${deleteTarget.name}" deleted`);
          if (selectedLocationId === deleteTarget.id) setSelectedLocationId(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    } else {
      deleteZoneMutation.mutate(deleteTarget.id, {
        onSuccess: () => toast.success(`Zone "${deleteTarget.name}" deleted`),
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    }
    setDeleteTarget(null);
  };

  const handleExport = async () => {
    try {
      const result = await geocontextApi.getLocations({ limit: 100000 });
      const fc = locationsToFeatureCollection(result.data);
      downloadFile("geocontext-locations.geojson", JSON.stringify(fc, null, 2));
      toast.success(`Exported ${result.data.length} locations to GeoJSON`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleImport = async (file: File) => {
    try {
      const fc = await parseGeoJSONFile(file);
      importGeoJSONMutation.mutate(fc, {
        onSuccess: (result) => toast.success(`Imported ${result.imported} locations`),
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBulkStatus = (status: "published" | "unpublished" | "draft") => {
    if (!hasSelection) return;
    bulkStatusMutation.mutate(
      { ids: [...selectedIds], status },
      {
        onSuccess: (result) => {
          toast.success(`Published state set for ${result.updated} location(s)`);
          setSelectedIds(new Set());
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  const handleBulkDelete = () => {
    if (!hasSelection) return;
    bulkDeleteMutation.mutate([...selectedIds], {
      onSuccess: (result) => {
        toast.success(`Deleted ${result.deleted} location(s)`);
        setSelectedIds(new Set());
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const handleBulkExport = () => {
    if (!selectedLocations.length) return;
    const fc = locationsToFeatureCollection(selectedLocations);
    downloadFile("geocontext-selection.geojson", JSON.stringify(fc, null, 2));
    toast.success(`Exported ${selectedLocations.length} selected location(s)`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="GeoContext"
        description="Egypt's geographic knowledge base — locations, restricted zones, warnings and insights."
      >
        <Button onClick={openCreateLocation}>
          <Plus className="size-4" />
          Add location
        </Button>
        <Button variant="outline" onClick={() => setDrawMode(drawMode === "location" ? null : "location")}>
          <MapPinPlus className="size-4" />
          Place on map
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <FileUp className="size-4" />
          Import GeoJSON
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Export GeoJSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
      </PageHeader>

      <GeoStatsGrid analytics={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CategoryPieChart analytics={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />
        <SeverityBarChart analytics={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />
        <TopUpdatedList analytics={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />
      </div>

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <SearchBar value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Search locations..." />
        <Select value={filters.category} onValueChange={(v) => setFilter("category", v ?? "")}>
          <SelectTrigger className="h-10 w-44 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {LOCATION_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.governorate} onValueChange={(v) => setFilter("governorate", v ?? "")}>
          <SelectTrigger className="h-10 w-44 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All governorates</SelectItem>
            {GOVERNORATES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilter("status", v ?? "")}>
          <SelectTrigger className="h-10 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {Object.entries(GEO_STATUS_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.risk} onValueChange={(v) => setFilter("risk", v ?? "")}>
          <SelectTrigger className="h-10 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any risk</SelectItem>
            {RISK_LEVELS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.updatedSince} onValueChange={(v) => setFilter("updatedSince", v ?? "")}>
          <SelectTrigger className="h-10 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any time</SelectItem>
            {RECENT_WINDOWS.map((w) => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.hasWarnings === "" ? "" : filters.hasWarnings ? "true" : "false"}
          onValueChange={(v) => setFilter("hasWarnings", v === null ? "" : v === "true")}
        >
          <SelectTrigger className="h-10 w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">With active warnings</SelectItem>
            <SelectItem value="false">Without warnings</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="relative rounded-2xl border border-border/50 shadow-sm">
            <GeoContextMap
              locations={locations}
              zones={zonesQuery.data ?? []}
              boundaries={boundariesQuery.data ?? []}
              visibleLayers={visibleLayers}
              selectedLocationId={selectedLocationId}
              drawMode={drawMode}
              heatPoints={heatPoints}
              onSelectLocation={setSelectedLocationId}
              onMapClick={handleMapClick}
              onPolygonDrawn={handlePolygonDrawn}
            />
            <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1.5">
              <ToolButton active={drawMode === "location"} onClick={() => setDrawMode(drawMode === "location" ? null : "location")} label="Place location" icon={<Target className="size-4" />} />
              <ToolButton active={drawMode === "zone"} onClick={() => setDrawMode(drawMode === "zone" ? null : "zone")} label="Draw restricted zone" icon={<SlashSquare className="size-4" />} />
              <ToolButton active={drawMode === "boundary"} onClick={() => setDrawMode(drawMode === "boundary" ? null : "boundary")} label="Draw boundary" icon={<Landmark className="size-4" />} />
            </div>
            {drawMode === "location" && (
              <div className="absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
                Click anywhere on the map to place a location
              </div>
            )}
          </div>
          <LayerPanel visibleLayers={visibleLayers} onToggle={toggleLayer} />
        </div>

        <div className="space-y-6">
          {selectedLocation ? (
            <LocationDetailsPanel
              location={selectedLocation}
              allLocations={locations}
              onEdit={() => setLocationDialog({ open: true, location: selectedLocation, initialCoords: null, reverse: null })}
              onAddWarning={() => setWarningDialog({ open: true, locationId: selectedLocation.id, locationName: selectedLocation.nameEn })}
              onDelete={() => setDeleteTarget({ kind: "location", name: selectedLocation.nameEn, id: selectedLocation.id })}
              onClose={() => setSelectedLocationId(null)}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ) : (
            <ActivityFeed events={activityQuery.data ?? []} isLoading={activityQuery.isLoading} className="xl:h-[480px] xl:overflow-y-auto" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {locationsQuery.isError ? (
          <ErrorState
            title="Failed to load locations"
            message={getErrorMessage(locationsQuery.error)}
            onRetry={() => locationsQuery.refetch()}
          />
        ) : (
          <>
            {hasSelection && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="size-4 text-primary" />
                  {selectedIds.size} selected
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatus("published")} disabled={bulkStatusMutation.isPending}>
                    <PlayCircle className="size-4 text-emerald-500" />
                    Publish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatus("draft")} disabled={bulkStatusMutation.isPending}>
                    Set draft
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatus("unpublished")} disabled={bulkStatusMutation.isPending}>
                    <PauseCircle className="size-4 text-amber-500" />
                    Unpublish
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkExport}>
                    <Download className="size-4" />
                    Export
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
            <LocationTable
              locations={locations}
              isLoading={locationsQuery.isLoading}
              selectedId={selectedLocationId ?? undefined}
              onSelect={(location) => setSelectedLocationId(location.id)}
              onEdit={(location) => setLocationDialog({ open: true, location, initialCoords: null, reverse: null })}
              onDelete={(location) => setDeleteTarget({ kind: "location", name: location.nameEn, id: location.id })}
              renderPublishToggle={(location) => <PublishButton location={location} canEdit={canEdit} />}
              canEdit={canEdit}
              canDelete={canDelete}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
            <Pagination
              page={page}
              totalPages={locationsQuery.data?.totalPages ?? 1}
              total={locationsQuery.data?.total ?? 0}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard
          title="Restricted zones"
          description="Military & safety restrictions"
          action={
            <Button size="sm" variant="outline" onClick={() => setDrawMode("zone")}>
              <Plus className="size-4" />
              Draw zone
            </Button>
          }
        >
          {zonesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : zonesQuery.data?.length ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Risk</TableHead>
                    <TableHead className="whitespace-nowrap">Active</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zonesQuery.data.map((zone) => (
                    <TableRow key={zone.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap font-medium">{zone.name}</TableCell>
                      <TableCell className="whitespace-nowrap capitalize text-muted-foreground">{zone.restrictionType.replace("_", " ")}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", riskChip(zone.riskLevel))}>{zone.riskLevel}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {zone.active ? <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span> : <span className="text-xs text-muted-foreground">Inactive</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setZoneDialog({ open: true, zone, polygon: zone.polygon })} disabled={!canEdit} title="Edit zone">
                            <Edit3Icon className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget({ kind: "zone", name: zone.name, id: zone.id })} disabled={!canDelete} title="Delete zone">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No restricted zones yet.</p>
          )}
        </DashboardCard>

        <DashboardCard
          title="Boundaries"
          description="Governorate & administrative borders"
          action={
            <Button size="sm" variant="outline" onClick={() => setDrawMode("boundary")}>
              <Plus className="size-4" />
              Draw boundary
            </Button>
          }
        >
          {boundariesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : boundariesQuery.data?.length ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boundariesQuery.data.map((boundary) => (
                    <TableRow key={boundary.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap font-medium">{boundary.name}</TableCell>
                      <TableCell className="whitespace-nowrap capitalize text-muted-foreground">{boundary.type}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{boundary.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No boundaries drawn yet.</p>
          )}
        </DashboardCard>
      </div>

      <LocationFormDialog
        open={locationDialog.open}
        onOpenChange={(open) => setLocationDialog((prev) => ({ ...prev, open }))}
        location={locationDialog.location}
        initialCoords={locationDialog.initialCoords}
        reverse={locationDialog.reverse}
      />
      <WarningFormDialog
        open={warningDialog.open}
        onOpenChange={(open) => setWarningDialog((prev) => ({ ...prev, open }))}
        locationId={warningDialog.locationId}
        locationName={warningDialog.locationName}
      />
      <RestrictedZoneFormDialog
        open={zoneDialog.open}
        onOpenChange={(open) => setZoneDialog((prev) => ({ ...prev, open }))}
        zone={zoneDialog.zone}
        polygon={zoneDialog.polygon}
        onRequestDraw={() => {
          setZoneDialog((prev) => ({ ...prev, open: false }));
          setDrawMode("zone");
        }}
      />
      <BoundaryFormDialog
        open={boundaryDialog.open}
        onOpenChange={(open) => setBoundaryDialog((prev) => ({ ...prev, open }))}
        polygon={boundaryDialog.polygon}
        onRequestDraw={() => {
          setBoundaryDialog((prev) => ({ ...prev, open: false }));
          setDrawMode("boundary");
        }}
        onCreated={(boundary) => {
          queryClient.setQueryData<Boundary[]>(GEO_QUERY_KEYS.boundaries, (old: Boundary[] | undefined) =>
            old ? [...old, boundary] : [boundary]
          );
          toast.success("Boundary saved");
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.kind === "zone" ? "Delete restricted zone?" : "Delete location?"}
        description={deleteTarget ? `"${deleteTarget.name}" will be removed. This action is audit-logged.` : undefined}
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteLocationMutation.isPending || deleteZoneMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function ToolButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl border shadow-lg backdrop-blur transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/50 bg-card/90 text-muted-foreground hover:bg-card hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}

function PublishButton({ location, canEdit }: { location: GeoLocation; canEdit: boolean }) {
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
      disabled={!canEdit || statusMutation.isPending}
      title={isPublished ? "Unpublish" : "Publish"}
    >
      {isPublished ? <PauseCircle className="size-4 text-amber-500" /> : <PlayCircle className="size-4 text-emerald-500" />}
    </Button>
  );
}

function Edit3Icon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function riskChip(level: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "moderate":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "high":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "extreme":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}
