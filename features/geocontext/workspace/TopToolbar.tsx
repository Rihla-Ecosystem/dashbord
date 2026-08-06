"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Circle,
  FileDown,
  FileUp,
  Fullscreen,
  Landmark,
  Layers,
  LayoutGrid,
  MapPin,
  MapPinPlus,
  MousePointer2,
  Pencil,
  Redo2,
  RotateCcw,
  ScrollText,
  Search,
  Settings,
  Shapes,
  ShieldAlert,
  Square,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayerPanel } from "../LayerPanel";
import { useGeoWorkspace, type WorkspaceSection } from "../workspace-context";
import type { MapCommand, MapDrawMode } from "../GeoContextMap";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  commandRef: React.MutableRefObject<MapCommand | null>;
}

const SECTIONS: { id: WorkspaceSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="size-4" /> },
  { id: "locations", label: "Locations", icon: <MapPinPlus className="size-4" /> },
  { id: "zones", label: "Restricted Areas", icon: <ShieldAlert className="size-4" /> },
  { id: "warnings", label: "Warnings", icon: <AlertTriangle className="size-4" /> },
  { id: "nearby", label: "Nearby Services", icon: <Activity className="size-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
  { id: "activity", label: "Audit Logs", icon: <ScrollText className="size-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="size-4" /> },
];

const DRAW_TOOLS: { mode: MapDrawMode; label: string; icon: React.ReactNode }[] = [
  { mode: "point", label: "Point", icon: <MapPin className="size-4" /> },
  { mode: "polygon", label: "Polygon", icon: <Shapes className="size-4" /> },
  { mode: "rectangle", label: "Rectangle", icon: <Square className="size-4" /> },
  { mode: "circle", label: "Circle", icon: <Circle className="size-4" /> },
  { mode: "multipolygon", label: "Multi-polygon", icon: <Layers className="size-4" /> },
];

function Dropdown({
  trigger,
  children,
  align = "left",
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-[900] mt-1.5 min-w-44 rounded-2xl border border-border/60 bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  active,
  disabled,
  destructive,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
        active ? "bg-primary text-primary-foreground" : destructive ? "text-destructive hover:bg-destructive/10" : "hover:bg-muted/60"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {active && <span className="size-1.5 rounded-full bg-current opacity-70" />}
    </button>
  );
}

export function TopToolbar({ commandRef }: ToolbarProps) {
  const ws = useGeoWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const selectedTarget = ws.selectedLocationId
    ? { kind: "location" as const, id: ws.selectedLocationId, name: ws.resolvedLocation?.nameEn ?? "selected location" }
    : ws.selectedZoneId
      ? { kind: "zone" as const, id: ws.selectedZoneId, name: ws.selectedZone?.name ?? "selected zone" }
      : ws.selectedBoundaryId
        ? { kind: "boundary" as const, id: ws.selectedBoundaryId, name: ws.selectedBoundary?.name ?? "selected boundary" }
        : null;

  const doDelete = () => {
    if (!selectedTarget) return;
    ws.requestDelete(selectedTarget);
    ws.confirmDelete();
    ws.closeDrawer();
    setConfirmDelete(false);
  };

  const isDrawing = ws.drawMode !== null;

  const startDraw = (mode: Exclude<MapDrawMode, null>) => {
    ws.setSection("map");
    ws.setMobileView("map");
    if (ws.drawMode === mode) {
      ws.setDrawMode(null);
      return;
    }
    if (mode === "zone") ws.openCreateZone();
    else if (mode === "boundary") ws.openCreateBoundary();
    else ws.openCreateLocation(mode);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border/60 bg-popover p-1.5 shadow-sm">
      <input
        ref={fileRef}
        type="file"
        accept=".json,.geojson"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void ws.handleImport(file);
          e.target.value = "";
        }}
      />

      {/* Sections */}
      <Dropdown
        trigger={
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" title="Sections">
            <LayoutGrid className="size-4" />
            <span className="hidden md:inline">Sections</span>
          </Button>
        }
      >
        {(close) => (
          <div className="space-y-0.5">
            {SECTIONS.map((s) => (
              <MenuItem
                key={s.id}
                icon={s.icon}
                label={s.label}
                active={ws.section === s.id}
                onClick={() => {
                  ws.setSection(s.id);
                  close();
                }}
              />
            ))}
          </div>
        )}
      </Dropdown>

      {/* Draw */}
      <Dropdown
        trigger={
          <Button
            variant={isDrawing ? "default" : "outline"}
            size="sm"
            className="shrink-0 gap-1.5"
            title="Draw tools"
          >
            <Shapes className="size-4" />
            <span className="hidden md:inline">Draw</span>
          </Button>
        }
      >
        {(close) => (
          <div className="space-y-0.5">
            {DRAW_TOOLS.map((tool) => (
              <MenuItem
                key={tool.mode}
                icon={tool.icon}
                label={tool.label}
                active={ws.drawMode === tool.mode}
                onClick={() => {
                  startDraw(tool.mode!);
                  close();
                }}
              />
            ))}
            <div className="my-1 h-px bg-border/60" />
            <MenuItem
              icon={<ShieldAlert className="size-4" />}
              label="Restricted zone"
              active={ws.drawMode === "zone"}
              disabled={!ws.canEdit}
              onClick={() => {
                startDraw("zone");
                close();
              }}
            />
            <MenuItem
              icon={<Landmark className="size-4" />}
              label="Boundary"
              active={ws.drawMode === "boundary"}
              disabled={!ws.canEdit}
              onClick={() => {
                startDraw("boundary");
                close();
              }}
            />
            <div className="my-1 h-px bg-border/60" />
            <MenuItem icon={<Undo2 className="size-4" />} label="Undo" disabled={!ws.canUndo} onClick={() => { ws.undoDraw(); close(); }} />
            <MenuItem icon={<Redo2 className="size-4" />} label="Redo" disabled={!ws.canRedo} onClick={() => { ws.redoDraw(); close(); }} />
            <MenuItem
              icon={<RotateCcw className="size-4" />}
              label="Clear draft"
              disabled={!ws.draftGeometry}
              onClick={() => { ws.setDraftGeometry(null); ws.setDrawMode(null); close(); }}
            />
          </div>
        )}
      </Dropdown>

      {/* Edit */}
      <Button
        variant={ws.editMode ? "default" : "outline"}
        size="sm"
        className="shrink-0 gap-1.5"
        title="Edit the drawn geometry (move vertices)"
        onClick={() => ws.setEditMode(!ws.editMode)}
      >
        <Pencil className="size-4" />
        <span className="hidden md:inline">Edit</span>
      </Button>

      {/* Delete */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          title="Delete the selected item"
          disabled={!selectedTarget}
          onClick={() => setConfirmDelete((v) => !v)}
        >
          <Trash2 className="size-4 text-destructive" />
          <span className="hidden md:inline">Delete</span>
        </Button>
        {confirmDelete && selectedTarget && (
          <div className="absolute left-0 top-full z-[900] mt-1.5 w-64 rounded-2xl border border-border/60 bg-popover p-3 shadow-xl animate-in fade-in-0 zoom-in-95">
            <p className="text-sm font-medium">Delete {selectedTarget.name}?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This permanently removes it and its related data. This action cannot be undone.
            </p>
            <div className="mt-2.5 flex items-center justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={doDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Layers */}
      <Dropdown
        align="left"
        trigger={
          <Button
            variant={showLayers ? "default" : "outline"}
            size="sm"
            className="shrink-0 gap-1.5"
            title="Layers"
            onClick={() => setShowLayers((v) => !v)}
          >
            <Layers className="size-4" />
            <span className="hidden md:inline">Layers</span>
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
              {Object.values(ws.visibleLayers).filter(Boolean).length}
            </span>
          </Button>
        }
      >
        {(close) => (
          <div className="w-72">
            <LayerPanel
              visibleLayers={ws.visibleLayers}
              onToggle={ws.toggleLayer}
              onReset={ws.resetLayers}
              onCollapsedChange={() => close()}
              className="rounded-none border-0 bg-transparent shadow-none"
            />
          </div>
        )}
      </Dropdown>

      {/* Import / Export */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        title="Import GeoJSON"
        disabled={!ws.canEdit}
        onClick={() => fileRef.current?.click()}
      >
        <FileUp className="size-4" />
        <span className="hidden md:inline">Import</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        title="Export GeoJSON"
        onClick={() => void ws.handleExport()}
      >
        <FileDown className="size-4" />
        <span className="hidden md:inline">Export</span>
      </Button>

      {/* Search */}
      <div className="relative ml-auto hidden min-w-0 flex-1 sm:block lg:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={ws.searchInput}
          onChange={(e) => ws.onSearchInputChange(e.target.value)}
          placeholder="Search locations…"
          className="h-8 w-full rounded-xl border border-border bg-background pl-8 pr-7 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
        {ws.searchInput && (
          <button
            type="button"
            onClick={() => ws.onSearchInputChange("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Fullscreen */}
      <Button
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        title="Toggle fullscreen"
        onClick={() => commandRef.current?.fullscreen()}
      >
        <Fullscreen className="size-4" />
      </Button>

      <span className="sr-only">
        <MousePointer2 className="size-4" />
      </span>
    </div>
  );
}
