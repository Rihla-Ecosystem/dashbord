"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Keyboard,
  Landmark,
  Loader2,
  PanelLeft,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { RoleGuard } from "@/features/auth/role-guard";
import { useAuth } from "@/features/auth/auth-context";
import { DEFAULT_BASEMAP, GEO_QUERY_KEYS, type BasemapId } from "@/constants/geocontext";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { geocontextApi } from "@/services/geocontext";
import {
  useBulkDeleteGeoLocations,
  useBulkGeoLocationStatus,
  useDeleteBoundary,
  useDeleteGeoLocation,
  useDeleteRestrictedZone,
  useGeoActivity,
  useGeoAnalytics,
  useGeoBoundaries,
  useGeoLocation,
  useGeoLocations,
  useGeoRestrictedZones,
  useGovernorates,
  useImportGeoJSON,
  useSetGeoLocationStatusNow,
} from "@/hooks/useGeocontext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MAP_LAYERS } from "@/constants/geocontext";
import dynamic from "next/dynamic";
import type { MapCommand, MapDrawMode } from "@/features/geocontext/GeoContextMap";
import { ContextMenu, type ContextMenuState } from "@/features/geocontext/ContextMenu";
import { toGeoSort } from "@/features/geocontext/LocationTable";
import { LeftSidebar } from "@/features/geocontext/workspace/LeftSidebar";
import { TopToolbar } from "@/features/geocontext/workspace/TopToolbar";
import { SectionDrawer } from "@/features/geocontext/workspace/SectionDrawer";
import { LocationDrawer } from "@/features/geocontext/drawer/LocationDrawer";
import { LocationFormModal } from "@/features/geocontext/drawer/LocationFormModal";
import { ZoneDrawerForm } from "@/features/geocontext/drawer/ZoneDrawerForm";
import { ZoneFormModal } from "@/features/geocontext/drawer/ZoneFormModal";
import { BoundaryDrawerForm } from "@/features/geocontext/drawer/BoundaryDrawerForm";
import { BoundaryFormModal } from "@/features/geocontext/drawer/BoundaryFormModal";
import {
  GeoWorkspaceContext,
  type DeleteTarget,
  type DrawIntent,
  type DrawerTarget,
  type GeoWorkspace,
  type WorkspaceSection,
} from "@/features/geocontext/workspace-context";
import {
  downloadFile,
  locationsToFeatureCollection,
  parseGeoJSONFile,
} from "@/features/geocontext/geoUtils";
import {
  multiPolygonGeometry,
  type DraftGeometry,
} from "@/features/geocontext/drawing/geometry";
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
  const [section, setSection] = useState<WorkspaceSection>("map");

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
  const [editMode, setEditMode] = useState(false);
  const [editZonesMode, setEditZonesMode] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>(() => {
    if (typeof window === "undefined") return DEFAULT_BASEMAP;
    return (localStorage.getItem("geocontext-basemap") as BasemapId) || DEFAULT_BASEMAP;
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const mapCommandRef = useRef<MapCommand | null>(null);

  // --- selections ---
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);
  const [recentLocationIds, setRecentLocationIds] = useState<string[]>([]);

  // --- right drawer state machine ---
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget>({ kind: "closed" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftGeometry, setDraftGeometry] = useState<DraftGeometry | null>(null);

  // --- drawing history (undo / redo) ---
  const [draftHist, setDraftHist] = useState<{ stack: DraftGeometry[]; index: number }>({
    stack: [],
    index: -1,
  });

  const commitDraft = (g: DraftGeometry | null) => {
    const h = draftHist;
    const stack = g ? [...h.stack.slice(0, h.index + 1), g] : h.stack.slice(0, h.index + 1);
    setDraftHist({ stack, index: g ? h.index + 1 : h.index });
    setDraftGeometry(g);
  };
  const undoDraw = () => {
    const h = draftHist;
    if (h.index <= 0) return;
    const index = h.index - 1;
    setDraftHist({ ...h, index });
    setDraftGeometry(h.stack[index] ?? null);
  };
  const redoDraw = () => {
    const h = draftHist;
    if (h.index >= h.stack.length - 1) return;
    const index = h.index + 1;
    setDraftHist({ ...h, index });
    setDraftGeometry(h.stack[index] ?? null);
  };
  const canUndo = draftHist.index > 0;
  const canRedo = draftHist.index < draftHist.stack.length - 1;

  // --- pending draw destination (a shape is being drawn with the form closed) ---
  const [drawIntent, setDrawIntent] = useState<DrawIntent>(null);

  // --- delete confirm ---
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // --- workspace layout (responsive) ---
  const [mobileView, setMobileView] = useState<"map" | "panel">("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const deleteBoundaryMutation = useDeleteBoundary();
  const bulkStatusMutation = useBulkGeoLocationStatus();
  const bulkDeleteMutation = useBulkDeleteGeoLocations();
  const importMutation = useImportGeoJSON();
  const statusNowMutation = useSetGeoLocationStatusNow();

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

  const pushRecentLocation = (id: string) => {
    setRecentLocationIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 10));
  };
  const flyToMap = (lat: number, lng: number, zoom?: number) => {
    mapCommandRef.current?.flyTo({ lat, lng }, zoom);
  };

  // --- right drawer state machine actions ---
  const openCreateLocation = (mode: MapDrawMode = "point") => {
    setDraftHist({ stack: [], index: -1 });
    setDraftGeometry(null);
    setDrawMode(mode);
    setDrawIntent({ kind: "create-location" });
    setSection("map");
    setMobileView("map");
    setDrawerTarget({ kind: "closed" });
    setDrawerOpen(false);
  };

  const openCreateZone = () => {
    setDrawMode("zone");
    setDrawIntent({ kind: "create-zone" });
    setSection("map");
    setMobileView("map");
    setDrawerTarget({ kind: "closed" });
    setDrawerOpen(false);
  };

  const openCreateBoundary = () => {
    setDrawMode("boundary");
    setDrawIntent({ kind: "create-boundary" });
    setSection("map");
    setMobileView("map");
    setDrawerTarget({ kind: "closed" });
    setDrawerOpen(false);
  };

  const openLocation = (location: GeoLocation | null, mode: "view" | "edit" = "view") => {
    if (!location) return;
    setSelectedLocationId(location.id);
    pushRecentLocation(location.id);
    setSection("map");
    setMobileView("map");
    setDrawMode(null);
    setDrawIntent(null);
    setDraftGeometry(null);
    setDrawerTarget({ kind: "location", mode, locationId: location.id });
    setDrawerOpen(true);
  };

  const openZone = (zone: RestrictedZone | null, mode: "view" | "edit" = "view") => {
    if (!zone) return;
    setSelectedZoneId(zone.id);
    setSection("map");
    setMobileView("map");
    setDrawMode(null);
    setDrawIntent(null);
    setDraftGeometry(null);
    setDrawerTarget({ kind: "zone", mode, zoneId: zone.id });
    setDrawerOpen(true);
  };

  const openBoundary = (boundary: Boundary | null, mode: "view" | "edit" = "view") => {
    if (!boundary) return;
    setSelectedBoundaryId(boundary.id);
    setSection("map");
    setMobileView("map");
    setDrawMode(null);
    setDrawIntent(null);
    setDraftGeometry(null);
    setDrawerTarget({ kind: "boundary", mode, boundaryId: boundary.id });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerTarget({ kind: "closed" });
    setDrawerOpen(false);
    setDrawMode(null);
    setEditMode(false);
    setDraftGeometry(null);
    setDrawIntent(null);
  };

  const setDrawerOpenControl = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setDrawerTarget({ kind: "closed" });
      setDrawMode(null);
      setEditMode(false);
      setDraftGeometry(null);
      setDrawIntent(null);
    }
  };

  /** Close the active Create/Edit overlay and switch to draw mode for its geometry. */
  const requestDraw = () => {
    const t = drawerTarget;
    let intent: DrawIntent = null;
    let mode: MapDrawMode = null;
    if (t.kind === "create-location") {
      intent = { kind: "create-location" };
      mode = "point";
    } else if (t.kind === "location") {
      intent = { kind: "edit-location", locationId: t.locationId };
      mode = "point";
    } else if (t.kind === "create-zone") {
      intent = { kind: "create-zone" };
      mode = "zone";
    } else if (t.kind === "zone") {
      intent = { kind: "edit-zone", zoneId: t.zoneId };
      mode = "zone";
    } else if (t.kind === "create-boundary") {
      intent = { kind: "create-boundary" };
      mode = "boundary";
    } else if (t.kind === "boundary") {
      intent = { kind: "edit-boundary", boundaryId: t.boundaryId };
      mode = "boundary";
    }
    setDrawIntent(intent);
    setDrawMode(mode);
    setDraftGeometry(null);
    setDrawerTarget({ kind: "closed" });
    setDrawerOpen(false);
    setSection("map");
    setMobileView("map");
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

  // --- delete ---
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
            if (selectedLocationId === t.id) {
              setSelectedLocationId(null);
              setDrawerTarget({ kind: "closed" });
              setDrawerOpen(false);
            }
            toast.success("Location deleted");
          },
        });
      }
    } else if (t.kind === "zone") {
      deleteZoneMutation.mutate(t.id, {
        onSuccess: () => {
          if (selectedZoneId === t.id) {
            setSelectedZoneId(null);
            setDrawerTarget({ kind: "closed" });
            setDrawerOpen(false);
          }
          toast.success("Restricted zone deleted");
        },
      });
    } else if (t.kind === "boundary") {
      deleteBoundaryMutation.mutate(t.id, {
        onSuccess: () => {
          if (selectedBoundaryId === t.id) {
            setSelectedBoundaryId(null);
            setDrawerTarget({ kind: "closed" });
            setDrawerOpen(false);
          }
          toast.success("Boundary deleted");
        },
      });
    }
    setDeleteTarget(null);
  };

  // --- map events ---
  const handleGeometryDrawn = (geometry: DraftGeometry) => {
    const ring = geometry.parts.find((p) => p.type === "polygon")?.coords ?? [];
    const intent = drawIntent;
    setDrawIntent(null);
    const locDefault = (createdGeometry: DraftGeometry) => {
      commitDraft(createdGeometry);
      setDrawerTarget({ kind: "create-location", geometry: createdGeometry });
    };
    if (intent?.kind === "create-zone") {
      setDrawerTarget({ kind: "create-zone", polygon: ring });
    } else if (intent?.kind === "edit-zone") {
      commitDraft(geometry);
      setDrawerTarget({ kind: "zone", mode: "edit", zoneId: intent.zoneId });
    } else if (intent?.kind === "create-boundary") {
      setDrawerTarget({ kind: "create-boundary", polygon: ring });
    } else if (intent?.kind === "edit-boundary") {
      commitDraft(geometry);
      setDrawerTarget({ kind: "boundary", mode: "edit", boundaryId: intent.boundaryId });
    } else if (intent?.kind === "edit-location") {
      commitDraft(geometry);
      setDrawerTarget({ kind: "location", mode: "edit", locationId: intent.locationId });
    } else {
      locDefault(geometry);
    }
    setDrawMode(null);
    setSection("map");
    setMobileView("map");
    setDrawerOpen(true);
  };

  const handleMultiPartDrawn = (ring: GeoCoordinates[]) => {
    const prev = draftGeometry;
    const existing = (prev?.parts ?? [])
      .filter((p) => p.type === "polygon")
      .flatMap((p) => (p.type === "polygon" ? [p.coords] : []));
    const geometry = multiPolygonGeometry([...existing, ring]);
    commitDraft(geometry);
    setDrawIntent(null);
    setSection("map");
    setDrawerTarget({ kind: "create-location", geometry });
    setDrawerOpen(true);
  };

  const handleDraftGeometryChange = (geometry: DraftGeometry | null) => {
    setDraftGeometry(geometry);
    if (drawerTarget.kind === "create-location") {
      setDrawerTarget({ kind: "create-location", geometry });
    }
  };

  const selectLocationFromMap = (id: string) => {
    const loc = locations.find((l) => l.id === id) ?? null;
    if (loc) openLocation(loc, "view");
  };
  const selectZoneFromMap = (id: string) => {
    const z = zones.find((z) => z.id === id) ?? null;
    if (z) openZone(z, "view");
  };
  const selectBoundaryFromMap = (id: string) => {
    const b = boundaries.find((b) => b.id === id) ?? null;
    if (b) openBoundary(b, "view");
  };

  const openLocationContextMenu = (location: GeoLocation, point: { x: number; y: number }) => {
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        {
          key: "view",
          label: "View details",
          icon: <EyeIcon />,
          onSelect: () => openLocation(location, "view"),
        },
        {
          key: "edit",
          label: "Edit location",
          icon: <Pencil className="size-4" />,
          disabled: !canEdit,
          onSelect: () => openLocation(location, "edit"),
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
          onSelect: () => {
            requestDelete({ kind: "location", id: location.id, name: location.nameEn });
            closeDrawer();
          },
        },
      ],
    });
  };

  const openZoneContextMenu = (zone: RestrictedZone, point: { x: number; y: number }) => {
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        { key: "view", label: "View zone", icon: <EyeIcon />, onSelect: () => openZone(zone, "view") },
        {
          key: "edit",
          label: "Edit zone",
          icon: <Pencil className="size-4" />,
          disabled: !canEdit,
          onSelect: () => openZone(zone, "edit"),
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
          onSelect: () => {
            requestDelete({ kind: "zone", id: zone.id, name: zone.name });
            closeDrawer();
          },
        },
      ],
    });
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
    { keys: "p", handler: () => openCreateLocation() },
    { keys: "z", handler: () => openCreateZone() },
    { keys: "e", handler: () => setEditMode((v) => !v) },
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
    selectedZoneId,
    selectedBoundaryId,
    resolvedLocation,
    selectedZone,
    selectedBoundary,
    recentLocationIds,
    pushRecentLocation,
    flyToMap,
    selectedIds,
    setSelectedIds: (ids) => setSelectedIds(new Set(ids)),
    hasSelection: selectedIds.size > 0,
    selectedLocations,
    visibleLayers,
    toggleLayer,
    resetLayers,
    drawMode,
    setDrawMode,
    editMode,
    setEditMode,
    editZonesMode,
    setEditZonesMode,
    basemap,
    setBasemap,
    drawerTarget,
    setDrawerTarget,
    drawerOpen,
    setDrawerOpen: setDrawerOpenControl,
    draftGeometry,
    setDraftGeometry,
    canUndo,
    canRedo,
    undoDraw,
    redoDraw,
    openCreateLocation,
    openCreateZone,
    openCreateBoundary,
    openLocation,
    openZone,
    openBoundary,
    closeDrawer,
    drawIntent,
    setDrawIntent,
    requestDraw,
    deleteTarget,
    requestDelete,
    confirmDelete,
    isDeleting:
      deleteLocationMutation.isPending ||
      bulkDeleteMutation.isPending ||
      deleteZoneMutation.isPending ||
      deleteBoundaryMutation.isPending,
    handleBulkStatus,
    handleBulkDelete,
    handleBulkExport,
    handleExport,
    handleImport,
    handleImportUrl,
    toggleLocationStatus,
    toggleZoneActive,
    updateZonePolygon,
    isZoneUpdating: zoneUpdateMutation.isPending,
    contextMenu,
    setContextMenu,
    mobileView,
    setMobileView,
  };

  return (
    <GeoWorkspaceContext.Provider value={workspace}>
      <div className="flex flex-col gap-3 lg:h-[calc(100dvh-11.5rem)] lg:min-h-[560px]">
        <PageHeader title="GeoContext Workspace" description="Manage Egypt's geographic knowledge — points of interest, restricted areas and warnings on a live map.">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <PanelLeft className="size-4" /> Browse
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="size-4" /> Shortcuts
            </Button>
            <Button size="sm" onClick={() => openCreateLocation()}>
              <Plus className="size-4" /> Add location
            </Button>
          </div>
        </PageHeader>

        <TopToolbar commandRef={mapCommandRef} />

        <div className="flex min-h-0 flex-1 gap-3">
          {/* left sidebar — search / filters / categories / list / recent / quick actions */}
          <div className="hidden w-[300px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-sm lg:block">
            <LeftSidebar />
          </div>

          {/* map pane — the persistent centre of the workspace */}
          <div
            className={cn(
              "relative z-0 min-h-[420px] flex-1 overflow-hidden rounded-2xl border border-border bg-popover shadow-sm",
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
              editMode={editMode}
              editZonesMode={editZonesMode}
              basemap={basemap}
              onBasemapChange={setBasemap}
              heatPoints={heatPoints}
              commandRef={mapCommandRef}
              onSelectLocation={selectLocationFromMap}
              onSelectZone={selectZoneFromMap}
              onSelectBoundary={selectBoundaryFromMap}
              onGeometryDrawn={handleGeometryDrawn}
              onMultiPartDrawn={handleMultiPartDrawn}
              onDraftGeometryChange={handleDraftGeometryChange}
              onZonePolygonEdited={updateZonePolygon}
              onLocationContextMenu={openLocationContextMenu}
              onZoneContextMenu={openZoneContextMenu}
            />
          </div>
        </div>
      </div>

      {/* mobile left sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-[320px] p-0 sm:max-w-sm">
          <LeftSidebar />
        </SheetContent>
      </Sheet>

      {/* right drawer — View Details for locations / zones / boundaries */}
      <LocationDrawer />
      <ZoneDrawerForm />
      <BoundaryDrawerForm />
      <SectionDrawer />

      {/* centered modals — Create / Edit / data-entry forms live here */}
      <LocationFormModal />
      <ZoneFormModal />
      <BoundaryFormModal />

      {/* right-click context menu host */}
      <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />

      {/* shortcut help */}
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </GeoWorkspaceContext.Provider>
  );
}

/** Keyboard shortcut reference sheet. */
function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const shortcuts: { key: string; label: string }[] = [
    { key: "1 – 9", label: "Jump to section" },
    { key: "P", label: "Add location" },
    { key: "Z", label: "Draw restricted zone" },
    { key: "E", label: "Toggle geometry edit" },
    { key: "?", label: "Show this shortcut sheet" },
    { key: "Esc", label: "Close drawers / cancel" },
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
