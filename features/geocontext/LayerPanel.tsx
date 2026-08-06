"use client";

import { useState } from "react";
import { ChevronDown, Layers, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MAP_LAYERS, categoryMeta } from "@/constants/geocontext";
import { cn } from "@/lib/utils";

interface LayerPanelProps {
  visibleLayers: Record<string, boolean>;
  onToggle: (id: string) => void;
  onReset?: () => void;
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const GROUPS: { title: string; kind: "marker" | "geo" | "overlay"; ids: string[] }[] = [
  { title: "Places", kind: "marker", ids: ["tourist_attractions", "photography_restricted", "hotels", "restaurants", "hospitals", "police_stations", "pharmacies", "transportation", "atms", "embassies"] },
  { title: "Geo", kind: "geo", ids: ["restricted_areas", "military_zones", "boundaries"] },
  { title: "Overlays", kind: "overlay", ids: ["warnings", "weather_layer", "ai_recommendations", "risk_heatmap"] },
];

export function LayerPanel({
  visibleLayers,
  onToggle,
  onReset,
  className,
  collapsed = false,
  onCollapsedChange,
}: LayerPanelProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Places: true, Geo: true, Overlays: true });
  const visibleCount = Object.values(visibleLayers).filter(Boolean).length;

  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-1 rounded-2xl border border-border/50 bg-background/90 p-1.5 shadow-lg backdrop-blur", className)}>
        <button
          type="button"
          onClick={() => onCollapsedChange?.(false)}
          title="Layer control"
          aria-label="Layer control"
          className="relative flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Layers className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
            {visibleCount}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-lg backdrop-blur", className)}>
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layers</h3>
        </div>
        <div className="flex items-center gap-0.5">
          {onReset && (
            <Button variant="ghost" size="icon-xs" onClick={onReset} title="Reset layers" aria-label="Reset layers">
              <RotateCcw className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onCollapsedChange?.(true)}
            title="Collapse"
            aria-label="Collapse layers"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="max-h-[50vh] space-y-2 overflow-y-auto p-2">
        {GROUPS.map((group) => {
          const open = openGroups[group.title] ?? true;
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <GroupGlyph kind={group.kind} />
                <span className="flex-1 text-left">{group.title}</span>
                <ChevronDown className={cn("size-3 transition-transform", !open && "-rotate-90")} />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {group.ids.map((id) => {
                    const def = MAP_LAYERS.find((l) => l.id === id);
                    if (!def) return null;
                    const active = !!visibleLayers[id];
                    return (
                      <label
                        key={id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40",
                          active && "bg-primary/[0.04]"
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm">
                          {def.kind === "markers" && (
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: def.categories?.[0] ? categoryMeta(def.categories[0]).color : "#0b6f6b" }}
                            />
                          )}
                          {def.kind === "geo" && <ShapeIcon className="size-3 text-muted-foreground" />}
                          {def.kind === "overlay" && <LayersIcon className="size-3 text-muted-foreground" />}
                          {def.label}
                        </span>
                        <Switch checked={active} onCheckedChange={() => onToggle(id)} size="sm" />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupGlyph({ kind }: { kind: "marker" | "geo" | "overlay" }) {
  if (kind === "geo") return <ShapeIcon className="text-muted-foreground" />;
  if (kind === "overlay") return <LayersIcon className="text-muted-foreground" />;
  return <DotRow />;
}

function DotRow() {
  return (
    <span className="flex items-center gap-0.5">
      <Dot color="#0ea5e9" />
      <Dot color="#10b981" />
      <Dot color="#f59e0b" />
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

function ShapeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("size-3", className)} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2l6 4v8l-6 4-6-4V6l6-4z" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("size-3", className)} fill="currentColor">
      <path d="M10 1l9 5-9 5-9-5 9-5zM1.2 11.2l8.8 4.9 8.8-4.9-1.6-.9-7.2 4-7.2-4-1.6.9zM1.2 15.2l8.8 4.9 8.8-4.9-1.6-.9-7.2 4-7.2-4-1.6.9z" />
    </svg>
  );
}