"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUp,
  HeartPulse,
  Keyboard,
  Landmark,
  Layers,
  LayoutGrid,
  Loader2,
  Map,
  MapPin,
  MapPinPlus,
  Pencil,
  Plus,
  Repeat,
  Settings,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RoleGuard } from "@/features/auth/role-guard";
import { useAuth } from "@/features/auth/auth-context";
import {
  DEFAULT_BASEMAP,
  GEO_QUERY_KEYS,
  type BasemapId,
} from "@/constants/geocontext";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { geocontextApi } from "@/services/geocontext";
import {
  useGeoActivity,
  useGeoAnalytics,
  useGeoBoundaries,
  useGeoLocation,
  useGeoLocations,
  useGeoRestrictedZones,
  useGovernorates,
  useBulkDeleteGeoLocations,
  useBulkGeoLocationStatus,
  useDeleteGeoLocation,
  useDeleteRestrictedZone,
  useImportGeoJSON,
  useSetGeoLocationStatusNow,
} from "@/hooks/useGeocontext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MAP_LAYERS } from "@/constants/geocontext";
import dynamic from "next/dynamic";
import type { MapDrawMode } from "@/features/geocontext/GeoContextMap";
import { LocationFormDialog } from "@/features/geocontext/LocationFormDialog";
import { WarningFormDialog } from "@/features/geocontext/WarningFormDialog";
import { RestrictedZoneFormDialog } from "@/features/geocontext/RestrictedZoneFormDialog";
import { BoundaryFormDialog } from "@/features/geocontext/BoundaryFormDialog";
import { LocationDetailsPanel } from "@/features/geocontext/LocationDetailsPanel";
import { ZoneDrawer } from "@/features/geocontext/ZoneDrawer";
import { BoundaryDrawer } from "@/features/geocontext/BoundaryDrawer";
import { LayerPanel } from "@/features/geocontext/LayerPanel";
import { FloatingActions, type FloatingAction } from "@/features/geocontext/FloatingActions";
import { ContextMenu, type ContextMenuState } from "@/features/geocontext/ContextMenu";
import { toGeoSort } from "@/features/geocontext/LocationTable";
import {
  GeoWorkspaceContext,
  useGeoWorkspace,
  type DeleteTarget,
  type GeoWorkspace,
  type WorkspaceSection,
} from "@/features/geocontext/workspace-context";
import { OverviewPanel } from "@/features/geocontext/panels/OverviewPanel";
import { LocationsPanel } from "@/features/geocontext/panels/LocationsPanel";
import { ZonesPanel } from "@/features/geocontext/panels/ZonesPanel";
import { WarningsPanel } from "@/features/geocontext/panels/WarningsPanel";
import { NearbyPanel } from "@/features/geocontext/panels/NearbyPanel";
import { AnalyticsPanel } from "@/features/geocontext/panels/AnalyticsPanel";
import { ActivityPanel } from "@/features/geocontext/panels/ActivityPanel";
import { SettingsPanel } from "@/features/geocontext/panels/SettingsPanel";
import {
  downloadFile,
  locationsToFeatureCollection,
  parseGeoJSONFile,
  reverseGeocode,
} from "@/features/geocontext/geoUtils";
import { makeHeatPoints } from "@/features/geocontext/map/heat-layer";
import type { SortingState } from "@tanstack/react-table";
import type {
  Boundary,
  GeoCoordinates,
  GeoFilters,
  GeoJSONFeatureCollection,
  GeoLocation,
  GeoStatus,
  RestrictedZone,
} from "@/types/geocontext";
import { getErrorMessage } from "@/utils";
import { cn } from "@/lib/utils";

const allLayersOn = Object.fromEntries(MAP_LAYERS.map((l) => [l.id, true]));

const GeoContextMap = dynamic(
  () => import("@/features/geocontext/GeoContextMap").then((m) => m.GeoContextMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Loading map…</span>
      </div>
    ),
  }
);

interface LocationDialogState {
  open: boolean;
  location: GeoLocation | null;
  initialCoords: { lat: number; lng: number } | null;
  reverse: Awaited<ReturnType<typeof reverseGeocode>> | null;
}

interface WarningDialogState {
  open: boolean;
  location: GeoLocation | null;
}

export default function GeocontextWorkspacePage() {
  return (
    <RoleGuard roles={["ADMIN", "MODERATOR"]}>
      <GeoContextWorkspace />
    </RoleGuard>
  );
}

function GeoContextWorkspace() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const canDelete = user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const qc = useQueryClient();

  // --- section & navigation ---
  const [section, setSection] = useState<WorkspaceSection>("overview");

  // --- locations table state ---
  const [filters, setFilters] = useState<GeoFilters>({ search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- map state ---
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(allLayersOn);
  const [drawMode, setDrawMode] = useState<MapDrawMode>(null);
  const [editZonesMode, setEditZonesMode] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>(() => {
    if (typeof window === "undefined") return DEFAULT_BASEMAP;
    return (localStorage.getItem("geocontext-basemap") as BasemapId) || DEFAULT_BASEMAP;
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // --- selections ---
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);

  // --- dialogs ---
  const [locationDialog, setLocationDialog] = useState<LocationDialogState>({
    open: false,
    location: null,
    initialCoords: null,
    reverse: null,
  });
  const [warningDialog, setWarningDialog] = useState<WarningDialogState>({ open: false, location: null });
  const [zoneDialog, setZoneDialog] = useState<{ open: boolean; zone: RestrictedZone | null; polygon: GeoCoordinates[] }>({
    open: false,
    zone: null,
    polygon: [],
  });
  const [boundaryDialog, setBoundaryDialog] = useState<{ open: boolean; polygon: GeoCoordinates[] }>({
    open: false,
    polygon: [],
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // --- workspace layout (responsive) ---
  const [mobileView, setMobileView] = useState<"map" | "panel">("map");
  const [panelWidth, setPanelWidth] = useState(468);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Persist basemap choice
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("geocontext-basemap", basemap);
  }, [basemap]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // --- data queries ---
  const locationsQuery = useGeoLocations({ page, limit, filters, sort: toGeoSort(sorting) });
  const zonesQuery = useGeoRestrictedZones();
  const boundariesQuery = useGeoBoundaries();
  const analyticsQuery = useGeoAnalytics();
  const activityQuery = useGeoActivity();
  const governoratesQuery = useGovernorates();

  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const zones = zonesQuery.data ?? [];
  const boundaries = boundariesQuery.data ?? [];
  const analytics = analyticsQuery.data;
  const activity = activityQuery.data ?? [];
  const governorateNames = useMemo(
    () => (governoratesQuery.data ?? []).map((g) => g.name),
    [governoratesQuery.data]
  );

  // --- single-location fallback for the details drawer ---
  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );
  const needsDetailFetch = !!selectedLocationId && !selectedLocation;
  const detailQuery = useGeoLocation(needsDetailFetch ? selectedLocationId : null);
  const resolvedLocation = selectedLocation ?? detailQuery.data ?? null;

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;
  const selectedBoundary = boundaries.find((b) => b.id === selectedBoundaryId) ?? null;

  const selectedLocations = useMemo(
    () => locations.filter((l) => selectedIds.has(l.id)),
    [locations, selectedIds]
  );

  const heatPoints = useMemo(
    () => makeHeatPoints(locations.map((l) => ({ lat: l.lat, lng: l.lng, intensity: 1 }))),
    [locations]
  );

  // --- mutations ---
  const deleteLocationMutation = useDeleteGeoLocation();
  const deleteZoneMutation = useDeleteRestrictedZone();
  const bulkStatusMutation = useBulkGeoLocationStatus();
  const bulkDeleteMutation = useBulkDeleteGeoLocations();
  const importMutation = useImportGeoJSON();
  const statusNowMutation = useSetGeoLocationStatusNow();

  const deleteBoundaryMutation = useMutation({
    mutationFn: (id: string) => geocontextApi.deleteBoundary(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Boundary[]>(GEO_QUERY_KEYS.boundaries, (old) => old?.filter((b) => b.id !== id) ?? []);
      if (selectedBoundaryId === id) setSelectedBoundaryId(null);
      toast.success("Boundary deleted");
    },
  });

  const zoneUpdateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<RestrictedZone> }) =>
      geocontextApi.updateRestrictedZone(id, patch),
    onSuccess: (updated) => {
      qc.setQueryData<RestrictedZone[]>(GEO_QUERY_KEYS.restrictedZones, (old) =>
        old?.map((z) => (z.id === updated.id ? updated : z)) ?? []
      );
    },
  });

  // --- handlers ---
  const setFilter = <K extends keyof GeoFilters>(key: K, value: GeoFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ search: filters.search });
    setSearchInput(filters.search);
    setPage(1);
  };
  const hasActiveFilters =
    !!(filters.category || filters.governorate || filters.status || filters.risk) ||
    filters.hasWarnings === true;
  const applyQuickFilter = (patch: Partial<GeoFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const toggleLayer = (id: string) => setVisibleLayers((v) => ({ ...v, [id]: !v[id] }));
  const resetLayers = () => setVisibleLayers(allLayersOn);

  const selectLocation = (id: string | null) => {
    setSelectedLocationId(id);
    setContextMenu(null);
  };
  const selectZone = (id: string | null) => {
    setSelectedZoneId(id);
    setContextMenu(null);
  };
  const selectBoundary = (id: string | null) => {
    setSelectedBoundaryId(id);
    setContextMenu(null);
  };

  const openCreateLocation = () => {
    setSection("map");
    setLocationDialog({ open: true, location: null, initialCoords: null, reverse: null });
  };
  const openEditLocation = (location: GeoLocation) => {
    setLocationDialog({
      open: true,
      location,
      initialCoords: location ? { lat: location.lat, lng: location.lng } : null,
      reverse: null,
    });
  };
  const openWarningDialog = (location: GeoLocation) => {
    setWarningDialog({ open: true, location });
  };
  const openZoneDialog = (zone?: RestrictedZone, polygon?: GeoCoordinates[]) => {
    setZoneDialog({ open: true, zone: zone ?? null, polygon: polygon ?? [] });
  };
  const openBoundaryDialog = (polygon?: GeoCoordinates[]) => {
    setBoundaryDialog({ open: true, polygon: polygon ?? [] });
  };

  const toggleLocationStatus = (location: GeoLocation) => {
    const next: GeoStatus = location.status === "published" ? "unpublished" : "published";
    statusNowMutation.mutate(
      { id: location.id, status: next },
      { onSuccess: () => toast.success(`Location ${next}`) }
    );
  };

  const toggleZoneActive = (zone: RestrictedZone) =>
    zoneUpdateMutation.mutate({ id: zone.id, patch: { active: !zone.active } });
  const updateZonePolygon = (id: string, coords: GeoCoordinates[]) =>
    zoneUpdateMutation.mutate({ id, patch: { polygon: coords } });

  const handleBulkStatus = (status: GeoStatus) => {
    if (!selectedIds.size) return;
    bulkStatusMutation.mutate(
      { ids: [...selectedIds], status },
      { onSuccess: () => { setSelectedIds(new Set()); toast.success("Locations updated"); } }
    );
  };
  const handleBulkDelete = () => {
    if (!selectedIds.size) return;
    setDeleteTarget({ kind: "location", name: `${selectedIds.size} selected locations`, id: "__bulk__" });
  };
  const handleBulkExport = () => {
    if (!selectedIds.size) return;
    const fc = locationsToFeatureCollection(selectedLocations);
    downloadFile("geocontext-selected.geojson", JSON.stringify(fc, null, 2));
    setSelectedIds(new Set());
    toast.success(`Exported ${selectedLocations.length} locations to GeoJSON`);
  };
  const handleExport = async () => {
    try {
      const fc = await geocontextApi.exportGeoJSON();
      downloadFile("geocontext-export.geojson", JSON.stringify(fc, null, 2));
      toast.success("Exported GeoContext data to GeoJSON");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const handleImport = async (file: File) => {
    try {
      const fc = await parseGeoJSONFile(file);
      importMutation.mutate(fc, {
        onSuccess: (r) => { toast.success(`Imported ${r.imported} locations`); setSection("locations"); },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const handleImportUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fc = (await res.json()) as GeoJSONFeatureCollection;
      if (fc.type !== "FeatureCollection") throw new Error("Not a GeoJSON FeatureCollection");
      importMutation.mutate(fc, {
        onSuccess: (r) => { toast.success(`Imported ${r.imported} locations`); setSection("locations"); },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleMapClick = async (latlng: { lat: number; lng: number }) => {
    setDrawMode(null);
    let reverse: Awaited<ReturnType<typeof reverseGeocode>> | null = null;
    try {
      reverse = await reverseGeocode(latlng.lat, latlng.lng);
    } catch {
      reverse = null;
    }
    setContextMenu(null);
    setLocationDialog({ open: true, location: null, initialCoords: latlng, reverse });
  };

  const requestDelete = (target: DeleteTarget | null) => setDeleteTarget(target);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const t = deleteTarget;
    if (t.kind === "location") {
      if (t.id === "__bulk__") {
        bulkDeleteMutation.mutate([...selectedIds], {
          onSuccess: () => {
            setSelectedIds(new Set());
            toast.success("Selected locations deleted");
          },
        });
      } else {
        deleteLocationMutation.mutate(t.id, {
          onSuccess: () => {
            if (selectedLocationId === t.id) setSelectedLocationId(null);
            toast.success("Location deleted");
          },
        });
      }
    } else if (t.kind === "zone") {
      deleteZoneMutation.mutate(t.id, {
        onSuccess: () => {
          if (selectedZoneId === t.id) setSelectedZoneId(null);
          toast.success("Restricted zone deleted");
        },
      });
    } else if (t.kind === "boundary") {
      deleteBoundaryMutation.mutate(t.id);
    }
    setDeleteTarget(null);
  };

  const openLocationContextMenu = (location: GeoLocation, point: { x: number; y: number }) => {
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        {
          key: "view",
          label: "View details",
          icon: <Eye className="size-4" />,
          onSelect: () => selectLocation(location.id),
        },
        {
          key: "edit",
          label: "Edit location",
          icon: <Pencil className="size-4" />,
          disabled: !canEdit,
          onSelect: () => openEditLocation(location),
        },
        { key: "divider1", divider: true },
        {
          key: "status",
          label: location.status === "published" ? "Unpublish" : "Publish",
          onSelect: () => toggleLocationStatus(location),
        },
        { key: "divider2", divider: true },
        {
          key: "delete",
          label: "Delete",
          icon: <Trash2 className="size-4" />,
          destructive: true,
          disabled: !canDelete,
          onSelect: () => handleDelete({ kind: "location", id: location.id, name: location.nameEn }),
        },
      ],
    });
  };

  const openZoneContextMenu = (zone: RestrictedZone, point: { x: number; y: number }) => {
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        { key: "view", label: "View zone", icon: <Eye className="size-4" />, onSelect: () => selectZone(zone.id) },
        {
          key: "edit",
          label: "Edit zone",
          icon: <Pencil className="size-4" />,
          disabled: !canEdit,
          onSelect: () => openZoneDialog(zone),
        },
        {
          key: "polygon",
          label: "Edit polygon",
          icon: <Landmark className="size-4" />,
          disabled: !canEdit,
          onSelect: () => { setEditZonesMode(true); setSection("map"); },
        },
        { key: "d1", divider: true },
        {
          key: "delete",
          label: "Delete",
          icon: <Trash2 className="size-4" />,
          destructive: true,
          disabled: !canDelete,
          onSelect: () => handleDelete({ kind: "zone", id: zone.id, name: zone.name }),
        },
      ],
    });
  };

  const handleDelete = (target: DeleteTarget) => setDeleteTarget(target);

  const requestDraw = (mode: Exclude<MapDrawMode, null>) => {
    setDrawMode(mode);
    setSection("map");
    setPanelCollapsed(false);
    setMobileView("map");
  };

  const handlePolygonDrawn = (coords: GeoCoordinates[]) => {
    if (drawMode === "zone") {
      setZoneDialog({ open: true, zone: null, polygon: coords });
    } else if (drawMode === "boundary") {
      setBoundaryDialog({ open: true, polygon: coords });
    } else {
      return;
    }
    setDrawMode(null);
  };

  // --- keyboard shortcuts ---
  useKeyboardShortcuts([
    { keys: "1", handler: () => setSection("overview") },
    { keys: "2", handler: () => setSection("map") },
    { keys: "3", handler: () => setSection("locations") },
    { keys: "4", handler: () => setSection("zones") },
    { keys: "5", handler: () => setSection("warnings") },
    { keys: "6", handler: () => setSection("nearby") },
    { keys: "7", handler: () => setSection("analytics") },
    { keys: "8", handler: () => setSection("activity") },
    { keys: "9", handler: () => setSection("settings") },
    { keys: "?", handler: () => setShortcutsOpen(true) },
  ]);

  const workspace: GeoWorkspace = {
    section,
    setSection,
    canEdit,
    canDelete,
    isAdmin,
    locations,
    zones,
    boundaries,
    analytics,
    activity,
    governorateNames,
    isLocationsLoading: locationsQuery.isLoading,
    locationsError: locationsQuery.error ?? null,
    refetchLocations: () => void locationsQuery.refetch(),
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    filtersOpen,
    setFiltersOpen,
    applyQuickFilter,
    searchInput,
    onSearchInputChange: setSearchInput,
    page,
    setPage,
    limit,
    setLimit,
    total: locationsQuery.data?.total ?? 0,
    totalPages: locationsQuery.data?.totalPages ?? 1,
    sorting,
    setSorting,
    selectedLocationId,
    selectLocation,
    selectedZoneId,
    selectZone,
    selectedBoundaryId,
    selectBoundary,
    selectedIds,
    setSelectedIds: (ids) => setSelectedIds(new Set(ids)),
    hasSelection: selectedIds.size > 0,
    selectedLocations,
    visibleLayers,
    toggleLayer,
    resetLayers,
    drawMode,
    setDrawMode,
    editZonesMode,
    setEditZonesMode,
    basemap,
    setBasemap: (id) => setBasemap(id),
    openCreateLocation,
    openEditLocation,
    openWarningDialog,
    openZoneDialog,
    openBoundaryDialog,
    deleteTarget,
    requestDelete,
    confirmDelete,
    isDeleting: deleteLocationMutation.isPending || bulkDeleteMutation.isPending || deleteZoneMutation.isPending || deleteBoundaryMutation.isPending,
    handleBulkStatus,
    handleBulkDelete,
    handleBulkExport,
    handleExport,
    handleImport,
    handleImportUrl,
    toggleLocationStatus,
    toggleZoneActive,
    updateZonePolygon,
    contextMenu,
    setContextMenu,
    mobileView,
    setMobileView,
  };

  return (
    <GeoWorkspaceContext.Provider value={workspace}>
      <div className="flex flex-col gap-4">
        <PageHeader title="GeoContext workspace" description="Monitor, edit and analyse Egypt's points of interest on a live map.">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="size-4" /> Shortcuts
            </Button>
            <Button size="sm" onClick={openCreateLocation}>
              <Plus className="size-4" /> Add location
            </Button>
          </div>
        </PageHeader>

        <TopToolbar section={section} setSection={setSection} />

        <div className="relative flex min-h-0 flex-col gap-4 lg:h-[calc(100dvh-17rem)] lg:flex-row">
          {/* left section rail */}
          <SectionRail section={section} setSection={setSection} />

          {/* map pane */}
          <div
            className={cn(
              "relative min-h-[420px] flex-1 overflow-hidden rounded-2xl border border-border bg-popover shadow-sm",
              mobileView === "panel" && "hidden lg:flex"
            )}
          >
            <GeoContextMap
              className="absolute inset-0 rounded-none"
              locations={locations}
              zones={zones}
              boundaries={boundaries}
              visibleLayers={visibleLayers}
              selectedLocationId={selectedLocationId}
              selectedZoneId={selectedZoneId}
              selectedBoundaryId={selectedBoundaryId}
              drawMode={drawMode}
              editZonesMode={editZonesMode}
              basemap={basemap}
              onBasemapChange={setBasemap}
              heatPoints={heatPoints}
              onSelectLocation={(id) => {
                setSelectedLocationId(id);
                setMobileView("panel");
              }}
              onSelectZone={selectZone}
              onSelectBoundary={selectBoundary}
              onMapClick={handleMapClick}
              onPolygonDrawn={handlePolygonDrawn}
              onZonePolygonEdited={updateZonePolygon}
              onLocationContextMenu={openLocationContextMenu}
              onZoneContextMenu={openZoneContextMenu}
            />

            <div className="pointer-events-none absolute left-3 top-3 z-[700] hidden md:block">
              <LayerPanel
                visibleLayers={visibleLayers}
                onToggle={toggleLayer}
                onReset={resetLayers}
                className="pointer-events-auto"
              />
            </div>

            <FloatingActions actions={buildFloatingActions(workspace, requestDraw)} />
          </div>

          {/* inspector / panels dock */}
          <InspectorDock
            section={section}
            panelWidth={panelWidth}
            setPanelWidth={setPanelWidth}
            collapsed={panelCollapsed}
            onCollapsedChange={setPanelCollapsed}
          />
        </div>

        <MobileViewSwitcher />
      </div>

      {/* overlays */}
      <WorkspaceOverlays
        selectedLocation={resolvedLocation}
        selectedLocationId={selectedLocationId}
        onCloseLocation={() => setSelectedLocationId(null)}
        selectedZone={selectedZone}
        selectedZoneId={selectedZoneId}
        onCloseZone={() => setSelectedZoneId(null)}
        selectedBoundary={selectedBoundary}
        onCloseBoundary={() => setSelectedBoundaryId(null)}
        locationDialog={locationDialog}
        setLocationDialog={setLocationDialog}
        warningDialog={warningDialog}
        setWarningDialog={setWarningDialog}
        zoneDialog={zoneDialog}
        setZoneDialog={setZoneDialog}
        boundaryDialog={boundaryDialog}
        setBoundaryDialog={setBoundaryDialog}
        shortcutsOpen={shortcutsOpen}
        setShortcutsOpen={setShortcutsOpen}
        isZoneUpdating={zoneUpdateMutation.isPending}
        onToggleZoneActive={toggleZoneActive}
        requestDraw={requestDraw}
      />
    </GeoWorkspaceContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Helpers used by the workspace shell
// -----------------------------------------------------------------------------

function SectionRail({ section, setSection }: { section: WorkspaceSection; setSection: (s: WorkspaceSection) => void }) {
  return (
    <div className="hidden shrink-0 flex-col items-stretch gap-1 rounded-xl border border-border/60 bg-popover p-1.5 md:flex md:w-14">
      {SECTION_ITEMS.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg transition-colors",
                  section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
                aria-label={item.label}
              />
            }
          >
            {item.icon}
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>{item.label}</span>
            <kbd>{item.shortcut}</kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function TopToolbar({ section, setSection }: { section: WorkspaceSection; setSection: (s: WorkspaceSection) => void }) {
  return (
    <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-xl border border-line/60 bg-popover p-1">
      {SECTION_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setSection(item.id)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {item.icon}
          <span>{item.label}</span>
          <kbd className="ml-1 hidden text-[10px] opacity-70 lg:inline">{item.shortcut}</kbd>
        </button>
      ))}
    </div>
  );
}

const SECTION_ITEMS: { id: WorkspaceSection; label: string; icon: ReactNode; shortcut: string }[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="size-5" />, shortcut: "1" },
  { id: "map", label: "Map", icon: <Map className="size-5" />, shortcut: "2" },
  { id: "locations", label: "Locations", icon: <MapPinPlus className="size-5" />, shortcut: "3" },
  { id: "zones", label: "Restricted zones", icon: <ShieldAlert className="size-5" />, shortcut: "4" },
  { id: "warnings", label: "Warnings", icon: <AlertTriangle className="size-5" />, shortcut: "5" },
  { id: "nearby", label: "Nearby services", icon: <HeartPulse className="size-5" />, shortcut: "6" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="size-5" />, shortcut: "7" },
  { id: "activity", label: "Activity", icon: <Activity className="size-5" />, shortcut: "8" },
  { id: "settings", label: "Settings", icon: <Settings className="size-5" />, shortcut: "9" },
];
const SECTION_TABS = SECTION_ITEMS;

const SECTION_PANELS: Record<WorkspaceSection, ReactNode> = {
  overview: <OverviewPanel />,
  map: null,
  locations: <LocationsPanel />,
  zones: <ZonesPanel />,
  warnings: <WarningsPanel />,
  nearby: <NearbyPanel />,
  analytics: <AnalyticsPanel />,
  activity: <ActivityPanel />,
  settings: <SettingsPanel />,
};

function buildFloatingActions(ws: GeoWorkspace, requestDraw: (m: Exclude<MapDrawMode, null>) => void): FloatingAction[] {
  return [
    {
      key: "location",
      label: "Add location",
      icon: <MapPin className="size-4" />,
      hidden: !ws.canEdit,
      onClick: () => ws.openCreateLocation(),
    },
    {
      key: "zone",
      label: "Draw restricted zone",
      icon: <ShieldAlert className="size-4" />,
      hidden: !ws.canEdit,
      active: ws.drawMode === "zone",
      onClick: () => requestDraw(ws.drawMode === "zone" ? "location" : "zone"),
    },
    {
      key: "boundary",
      label: "Draw boundary",
      icon: <Landmark className="size-4" />,
      hidden: !ws.canEdit,
      active: ws.drawMode === "boundary",
      onClick: () => requestDraw(ws.drawMode === "boundary" ? "location" : "boundary"),
    },
    {
      key: "edit-zones",
      label: "Edit zone polygons",
      icon: <Repeat className="size-4" />,
      hidden: !ws.canEdit,
      active: ws.editZonesMode,
      onClick: () => {
        ws.setEditZonesMode(!ws.editZonesMode);
        ws.setSection("map");
      },
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
  ];
}

interface InspectorDockProps {
  section: WorkspaceSection;
  panelWidth: number;
  setPanelWidth: (w: number) => void;
  collapsed: boolean;
  onCollapsedChange: (c: boolean) => void;
}

/** Right-side, resizable inspector dock that hosts the active section panel. */
function InspectorDock({ section, panelWidth, setPanelWidth, collapsed, onCollapsedChange }: InspectorDockProps) {
  const ws = useGeoWorkspace();
  const panel = SECTION_PANELS[section];

  const isPanelSection = section !== "map" && panel !== null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (window.innerWidth < 1024) return;
    const startX = e.clientX;
    const startWidth = panelWidth;
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(720, Math.max(320, startWidth + (startX - ev.clientX)));
      setPanelWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!isPanelSection) return null;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-border/70 bg-background",
        "w-full rounded-2xl border shadow-sm",
        "lg:w-[--panel-w] lg:rounded-none lg:border-y-0 lg:border-r lg:bg-muted/30",
        ws.mobileView === "map" && "hidden lg:flex"
      )}
      style={{ "--panel-w": `${collapsed ? 56 : panelWidth}px` } as React.CSSProperties}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => onCollapsedChange(false)}
          className="hidden h-full flex-col items-center gap-1 py-3 text-muted-foreground lg:flex"
          aria-label="Expand panel"
        >
          <ChevronLeft className="size-4 rotate-180" />
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-semibold uppercase tracking-wider">
            {SECTION_TABS.find((t) => t.id === section)?.label ?? section}
          </span>
        </button>
      ) : (
        <>
          <div
            role="separator"
            onPointerDown={onPointerDown}
            className="group absolute -left-1.5 top-0 z-20 hidden h-full w-3 cursor-col-resize items-center justify-center lg:flex"
          >
            <div className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
          </div>
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold capitalize">
              {SECTION_TABS.find((t) => t.id === section)?.icon}
              {SECTION_TABS.find((t) => t.id === section)?.label}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => onCollapsedChange(true)} aria-label="Collapse panel">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{panel}</div>
        </>
      )}
    </aside>
  );
}

/** Toggle shown on small screens to switch between the map view and the panel view. */
function MobileViewSwitcher() {
  const ws = useGeoWorkspace();
  return (
    <div className="fixed bottom-4 left-1/2 z-[800] flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-background/95 p-1 shadow-lg backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={() => {
          ws.setMobileView("map");
          ws.setSection("map");
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
          ws.mobileView === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
      >
        <Map className="size-3.5" /> Map
      </button>
      <button
        type="button"
        onClick={() => {
          ws.setMobileView("panel");
          const target = ws.section === "map" ? "locations" : ws.section;
          ws.setSection(target);
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
          ws.mobileView === "panel" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
      >
        <Layers className="size-3.5" /> Panel
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Overlays: selection drawers, dialogs, confirm, context menu & shortcut help
// -----------------------------------------------------------------------------

interface WorkspaceOverlaysProps {
  selectedLocation: GeoLocation | null;
  selectedLocationId: string | null;
  onCloseLocation: () => void;
  selectedZone: RestrictedZone | null;
  selectedZoneId: string | null;
  onCloseZone: () => void;
  selectedBoundary: Boundary | null;
  onCloseBoundary: () => void;
  locationDialog: LocationDialogState;
  setLocationDialog: React.Dispatch<React.SetStateAction<LocationDialogState>>;
  warningDialog: WarningDialogState;
  setWarningDialog: React.Dispatch<React.SetStateAction<WarningDialogState>>;
  zoneDialog: { open: boolean; zone: RestrictedZone | null; polygon: GeoCoordinates[] };
  setZoneDialog: React.Dispatch<React.SetStateAction<{ open: boolean; zone: RestrictedZone | null; polygon: GeoCoordinates[] }>>;
  boundaryDialog: { open: boolean; polygon: GeoCoordinates[] };
  setBoundaryDialog: React.Dispatch<React.SetStateAction<{ open: boolean; polygon: GeoCoordinates[] }>>;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  isZoneUpdating: boolean;
  onToggleZoneActive: (zone: RestrictedZone) => void;
  requestDraw: (m: Exclude<MapDrawMode, null>) => void;
}

function WorkspaceOverlays({
  selectedLocation,
  selectedLocationId,
  onCloseLocation,
  selectedZone,
  selectedZoneId,
  onCloseZone,
  selectedBoundary,
  onCloseBoundary,
  locationDialog,
  setLocationDialog,
  warningDialog,
  setWarningDialog,
  zoneDialog,
  setZoneDialog,
  boundaryDialog,
  setBoundaryDialog,
  shortcutsOpen,
  setShortcutsOpen,
  isZoneUpdating,
  onToggleZoneActive,
  requestDraw,
}: WorkspaceOverlaysProps) {
  const ws = useGeoWorkspace();
  const qc = useQueryClient();

  const deleteIsBulk = ws.deleteTarget?.id === "__bulk__";
  const deleteTitle = deleteIsBulk ? "Delete selected locations?" : `Delete ${ws.deleteTarget?.kind ?? "item"}?`;
  const deleteDescription = deleteIsBulk
    ? "This will permanently remove all selected locations and their related data."
    : `This will permanently remove "${ws.deleteTarget?.name ?? ""}" and its related data. This action cannot be undone.`;

  const showLocationSheet = selectedLocationId !== null && selectedLocation !== null;
  const showZoneSheet = selectedZoneId !== null && selectedZone !== null;
  const showBoundarySheet = selectedBoundary !== null;

  return (
    <>
      {/* selection drawers */}
      {showLocationSheet && selectedLocation && (
        <Sheet open onOpenChange={(open) => !open && onCloseLocation()}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full border-l border-border/70 bg-background p-0 sm:max-w-xl"
          >
            <LocationDetailsPanel
              location={selectedLocation}
              onEdit={() => ws.openEditLocation(selectedLocation)}
              onAddWarning={() => ws.openWarningDialog(selectedLocation)}
              onDelete={() => ws.requestDelete({ kind: "location", id: selectedLocation.id, name: selectedLocation.nameEn })}
              onClose={onCloseLocation}
              canEdit={ws.canEdit}
              canDelete={ws.canDelete}
              allLocations={ws.locations}
            />
          </SheetContent>
        </Sheet>
      )}

      {showZoneSheet && selectedZone && (
        <Sheet open onOpenChange={(open) => !open && onCloseZone()}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full border-l border-border/70 bg-background p-0 sm:max-w-xl"
          >
            <ZoneDrawer
              zone={selectedZone}
              open
              onOpenChange={onCloseZone}
              canEdit={ws.canEdit}
              canDelete={ws.canDelete}
              onEdit={() => ws.openZoneDialog(selectedZone)}
              onDelete={() => ws.requestDelete({ kind: "zone", id: selectedZone.id, name: selectedZone.name })}
              onToggleActive={() => onToggleZoneActive(selectedZone)}
              isToggling={isZoneUpdating}
            />
          </SheetContent>
        </Sheet>
      )}

      {showBoundarySheet && selectedBoundary && (
        <Sheet open onOpenChange={(open) => !open && onCloseBoundary()}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full border-l border-border/70 bg-background p-0 sm:max-w-xl"
          >
            <BoundaryDrawer
              boundary={selectedBoundary}
              open
              onOpenChange={onCloseBoundary}
              canEdit={ws.canEdit}
              canDelete={ws.canDelete}
              onEdit={() => ws.openBoundaryDialog(selectedBoundary.polygon)}
              onDelete={() => ws.requestDelete({ kind: "boundary", id: selectedBoundary.id, name: selectedBoundary.name })}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* creation / edit dialogs */}
      <LocationFormDialog
        open={locationDialog.open}
        onOpenChange={(open) => setLocationDialog((d) => ({ ...d, open }))}
        location={locationDialog.location}
        initialCoords={locationDialog.initialCoords}
        reverse={locationDialog.reverse}
      />

      <WarningFormDialog
        open={warningDialog.open}
        onOpenChange={(open) => setWarningDialog((d) => ({ ...d, open }))}
        locationId={warningDialog.location?.id ?? ""}
        locationName={warningDialog.location?.nameEn ?? ""}
      />

      <RestrictedZoneFormDialog
        open={zoneDialog.open}
        onOpenChange={(open) => setZoneDialog((d) => ({ ...d, open, polygon: open ? d.polygon : [] }))}
        zone={zoneDialog.zone}
        polygon={zoneDialog.polygon}
        onRequestDraw={() => {
          setZoneDialog((d) => ({ ...d, open: false }));
          requestDraw("zone");
        }}
      />

      <BoundaryFormDialog
        open={boundaryDialog.open}
        onOpenChange={(open) => setBoundaryDialog((d) => ({ ...d, open }))}
        polygon={boundaryDialog.polygon}
        onRequestDraw={() => {
          setBoundaryDialog((d) => ({ ...d, open: false }));
          requestDraw("boundary");
        }}
        onCreated={(b) => {
          qc.setQueryData<Boundary[]>(GEO_QUERY_KEYS.boundaries, (old) => (old ? [...old, b] : [b]));
          toast.success("Boundary saved");
        }}
      />

      {/* delete confirm */}
      <ConfirmDialog
        open={ws.deleteTarget !== null}
        onOpenChange={(open) => !open && ws.requestDelete(null)}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={deleteIsBulk ? "Delete selected" : "Delete"}
        variant="destructive"
        isLoading={ws.isDeleting}
        onConfirm={ws.confirmDelete}
      />

      {/* right-click context menu host */}
      <ContextMenu state={ws.contextMenu} onClose={() => ws.setContextMenu(null)} />

      {/* shortcut help */}
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}

/** Keyboard shortcut reference dialog. */
function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const shortcuts: { key: string; label: string }[] = [
    { key: "1 – 9", label: "Jump to section" },
    { key: "?", label: "Show this shortcut sheet" },
    { key: "Esc", label: "Close dialogs / cancel" },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="mx-auto w-full max-w-lg rounded-t-2xl">
        <SheetTitle className="flex items-center gap-2 text-base font-semibold">
          <Keyboard className="size-4" /> Keyboard shortcuts
        </SheetTitle>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">{s.key}</kbd>
            </div>
          ))}
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Got it
        </Button>
      </SheetContent>
    </Sheet>
  );
}