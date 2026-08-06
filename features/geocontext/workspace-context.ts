"use client";

import { createContext, useContext } from "react";
import type { SortingState } from "@tanstack/react-table";
import type {
  ActivityEvent,
  Boundary,
  GeoAnalytics,
  GeoCoordinates,
  GeoFilters,
  GeoLocation,
  GeoStatus,
  RestrictedZone,
} from "@/types/geocontext";
import type { MapDrawMode } from "./GeoContextMap";
import type { ContextMenuState } from "./ContextMenu";
import type { BasemapId } from "@/constants/geocontext";
import type { DraftGeometry } from "./drawing/geometry";

export type WorkspaceSection =
  | "overview"
  | "map"
  | "locations"
  | "zones"
  | "warnings"
  | "nearby"
  | "analytics"
  | "activity"
  | "settings";

/**
 * Where a freshly-drawn shape should be routed. Set when the user asks to
 * (re)draw a geometry with the centered form closed; consumed by the page
 * after a `draw:created` event to reopen the matching Create/Edit form.
 */
export type DrawIntent =
  | { kind: "create-location" }
  | { kind: "edit-location"; locationId: string }
  | { kind: "create-zone" }
  | { kind: "edit-zone"; zoneId: string }
  | { kind: "create-boundary" }
  | { kind: "edit-boundary"; boundaryId: string }
  | null;

export interface DeleteTarget {
  kind: "location" | "zone" | "boundary";
  name: string;
  id: string;
}

/**
 * State machine that drives the professional right-side drawer. The drawer hosts
 * every CRUD interaction — no modals, no forms floating under the map.
 */
export type DrawerTarget =
  | { kind: "closed" }
  | { kind: "location"; mode: "view" | "edit"; locationId: string }
  | { kind: "create-location"; geometry: DraftGeometry | null }
  | { kind: "zone"; mode: "view" | "edit"; zoneId: string }
  | { kind: "create-zone"; polygon: GeoCoordinates[] }
  | { kind: "boundary"; mode: "view" | "edit"; boundaryId: string }
  | { kind: "create-boundary"; polygon: GeoCoordinates[] };

export interface GeoWorkspace {
  section: WorkspaceSection;
  setSection: (section: WorkspaceSection) => void;

  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;

  locations: GeoLocation[];
  zones: RestrictedZone[];
  boundaries: Boundary[];
  analytics: GeoAnalytics | undefined;
  activity: ActivityEvent[];
  governorateNames: string[];
  isLocationsLoading: boolean;
  locationsError: Error | null;
  refetchLocations: () => void;

  filters: GeoFilters;
  setFilter: <K extends keyof GeoFilters>(key: K, value: GeoFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  applyQuickFilter: (patch: Partial<GeoFilters>) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;

  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  total: number;
  totalPages: number;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;

  selectedLocationId: string | null;
  selectedZoneId: string | null;
  selectedBoundaryId: string | null;
  /** The fully resolved selected location (list row or dedicated detail fetch). */
  resolvedLocation: GeoLocation | null;
  selectedZone: RestrictedZone | null;
  selectedBoundary: Boundary | null;

  /** Recently opened locations (most recent first). */
  recentLocationIds: string[];
  pushRecentLocation: (id: string) => void;

  /** Instruct the map to fly to a coordinate. */
  flyToMap: (lat: number, lng: number, zoom?: number) => void;

  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  hasSelection: boolean;
  selectedLocations: GeoLocation[];

  visibleLayers: Record<string, boolean>;
  toggleLayer: (id: string) => void;
  resetLayers: () => void;
  drawMode: MapDrawMode;
  setDrawMode: (mode: MapDrawMode) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  editZonesMode: boolean;
  setEditZonesMode: (mode: boolean) => void;
  basemap: BasemapId;
  setBasemap: (id: BasemapId) => void;

  // ---- right drawer state machine ----
  drawerTarget: DrawerTarget;
  setDrawerTarget: (target: DrawerTarget) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** Geometry currently being created/edited for a location. */
  draftGeometry: DraftGeometry | null;
  setDraftGeometry: (geometry: DraftGeometry | null) => void;

  // ---- drawing history (undo / redo) ----
  canUndo: boolean;
  canRedo: boolean;
  undoDraw: () => void;
  redoDraw: () => void;

  openCreateLocation: (mode?: MapDrawMode) => void;
  openCreateZone: () => void;
  openCreateBoundary: () => void;
  openLocation: (location: GeoLocation | null, mode?: "view" | "edit") => void;
  openZone: (zone: RestrictedZone | null, mode?: "view" | "edit") => void;
  openBoundary: (boundary: Boundary | null, mode?: "view" | "edit") => void;
  closeDrawer: () => void;

  /** Pending destination for a shape the user is about to draw on the map. */
  drawIntent: DrawIntent;
  setDrawIntent: (intent: DrawIntent) => void;
  /** Close the current Create/Edit overlay and enter draw mode for its geometry. */
  requestDraw: () => void;

  deleteTarget: DeleteTarget | null;
  requestDelete: (target: DeleteTarget | null) => void;
  confirmDelete: () => void;
  isDeleting: boolean;

  handleBulkStatus: (status: GeoStatus) => void;
  handleBulkDelete: () => void;
  handleBulkExport: () => void;
  handleExport: () => void;
  handleImport: (file: File) => void;
  handleImportUrl: (url: string) => void;
  toggleLocationStatus: (location: GeoLocation) => void;

  toggleZoneActive: (zone: RestrictedZone) => void;
  updateZonePolygon: (id: string, coords: GeoCoordinates[]) => void;
  isZoneUpdating: boolean;

  contextMenu: ContextMenuState | null;
  setContextMenu: (state: ContextMenuState | null) => void;

  mobileView: "map" | "panel";
  setMobileView: (view: "map" | "panel") => void;
}

export const GeoWorkspaceContext = createContext<GeoWorkspace | null>(null);

export function useGeoWorkspace(): GeoWorkspace {
  const ctx = useContext(GeoWorkspaceContext);
  if (!ctx) throw new Error("useGeoWorkspace must be used within GeoWorkspaceProvider");
  return ctx;
}

export const SECTION_SHORTCUTS: Record<string, WorkspaceSection> = {
  "1": "overview",
  "2": "map",
  "3": "locations",
  "4": "zones",
  "5": "warnings",
  "6": "nearby",
  "7": "analytics",
  "8": "activity",
  "9": "settings",
};
