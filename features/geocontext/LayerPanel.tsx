"use client";

import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MAP_LAYERS } from "@/constants/geocontext";
import { cn } from "@/lib/utils";

interface LayerPanelProps {
  visibleLayers: Record<string, boolean>;
  onToggle: (id: string) => void;
  className?: string;
}

const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Places", ids: ["tourist_attractions", "photography_restricted", "hotels", "restaurants", "hospitals", "police_stations", "pharmacies", "transportation", "atms", "embassies"] },
  { title: "Geo", ids: ["restricted_areas", "military_zones", "boundaries"] },
  { title: "Overlays", ids: ["warnings", "weather_layer", "traffic_layer", "ai_recommendations", "risk_heatmap"] },
];

export function LayerPanel({ visibleLayers, onToggle, className }: LayerPanelProps) {
  return (
    <div className={cn("w-full rounded-2xl border border-border/50 bg-card p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Layers className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Map layers</h3>
      </div>
      <div className="space-y-4">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.ids.map((id) => {
                const def = MAP_LAYERS.find((l) => l.id === id);
                if (!def) return null;
                return (
                  <div key={id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40">
                    <span className="flex items-center gap-2 text-sm">
                      {def.kind === "markers" && (
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: def.categories?.[0] ? categoryColor(def.categories[0]) : "#0b6f6b" }}
                        />
                      )}
                      {def.label}
                    </span>
                    <Switch checked={!!visibleLayers[id]} onCheckedChange={() => onToggle(id)} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    attraction: "#0ea5e9",
    historical: "#8b5cf6",
    museum: "#6366f1",
    restricted: "#ef4444",
    hotel: "#f59e0b",
    restaurant: "#f97316",
    hospital: "#10b981",
    police: "#3b82f6",
    pharmacy: "#14b8a6",
    transportation: "#64748b",
    atm: "#22c55e",
    embassy: "#a855f7",
    mosque: "#84cc16",
    park: "#2dd4bf",
    beach: "#38bdf8",
    shopping: "#e879f9",
    other: "#94a3b8",
  };
  return colors[category] ?? "#0b6f6b";
}
