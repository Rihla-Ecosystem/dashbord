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

export interface DeleteTarget {
  kind: "location" | "zone" | "boundary";
  name: string;
  id: string;
}

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
  selectLocation: (id: string | null) => void;
  selectedZoneId: string | null;
  selectZone: (id: string | null) => void;
  selectedBoundaryId: string | null;
  selectBoundary: (id: string | null) => void;

  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  hasSelection: boolean;
  selectedLocations: GeoLocation[];

  visibleLayers: Record<string, boolean>;
  toggleLayer: (id: string) => void;
  resetLayers: () => void;
  drawMode: MapDrawMode;
  setDrawMode: (mode: MapDrawMode) => void;
  editZonesMode: boolean;
  setEditZonesMode: (mode: boolean) => void;
  basemap: BasemapId;
  setBasemap: (id: BasemapId) => void;

  openCreateLocation: () => void;
  openEditLocation: (location: GeoLocation) => void;
  openWarningDialog: (location: GeoLocation) => void;
  openZoneDialog: (zone?: RestrictedZone, polygon?: GeoCoordinates[]) => void;
  openBoundaryDialog: (polygon?: GeoCoordinates[]) => void;
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