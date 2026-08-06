"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, Globe2, Layers, Link2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BASEMAPS, type BasemapId } from "@/constants/geocontext";
import { useGeoWorkspace } from "../workspace-context";

export function SettingsPanel() {
  const ws = useGeoWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importUrl, setImportUrl] = useState("");

  const importFromUrl = async () => {
    const url = importUrl.trim();
    if (!url) {
      toast.error("Paste a GeoJSON URL first");
      return;
    }
    await ws.handleImportUrl(url);
    setImportUrl("");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/50 px-4 py-2.5">
        <h3 className="text-sm font-semibold">Settings &amp; data</h3>
        <p className="text-xs text-muted-foreground">Map preferences and import/export tooling</p>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">Map</h4>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Default basemap</label>
              <Select value={ws.basemap} onValueChange={(v) => ws.setBasemap((v as BasemapId) ?? "street")}>
                <SelectTrigger className="h-9 w-full rounded-xl">
                  <SelectValue placeholder="Select basemap" />
                </SelectTrigger>
                <SelectContent>
                  {BASEMAPS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Uses MapTiler when <code>NEXT_PUBLIC_MAPTILER_KEY</code> is configured, otherwise Esri / CARTO.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Map layers</span>
              <Button variant="outline" size="sm" onClick={ws.resetLayers}>
                <RefreshCcw className="size-4" />
                Reset to defaults
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileUp className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">Import GeoJSON</h4>
          </div>
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.json,application/geo+json,application/json"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:cursor-pointer hover:file:bg-primary/90"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void ws.handleImport(file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void importFromUrl();
                  }
                }}
                placeholder="Or paste a GeoJSON URL"
                className="h-9 flex-1 rounded-xl"
              />
              <Button variant="outline" onClick={() => void importFromUrl()}>
                <Link2 className="size-4" />
                Fetch
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: GeoJSON FeatureCollection with Point geometries. Fields: nameEn, nameAr, category, governorate, city, country, lat, lng, safetyScore, riskLevel, status.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Download className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">Export</h4>
          </div>
          <div className="flex flex-col gap-2.5">
            <Button variant="outline" onClick={ws.handleExport}>
              <Download className="size-4" />
              Export all locations to GeoJSON
            </Button>
            {ws.hasSelection && (
              <Button variant="outline" onClick={ws.handleBulkExport}>
                <Download className="size-4" />
                Export {ws.selectedIds.size} selected locations
              </Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { geocontextApi } = await import("@/services/geocontext");
                  const { downloadFile } = await import("../geoUtils");
                  const fc = await geocontextApi.exportGeoJSON();
                  downloadFile("geocontext-boundaries.geojson", JSON.stringify(fc, null, 2));
                  toast.success("Exported boundary data to GeoJSON");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Export failed");
                }
              }}
            >
              <Download className="size-4" />
              Export boundaries to GeoJSON
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">Keyboard shortcuts</h4>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <Shortcut keys="1 – 9" label="Switch section" />
            <Shortcut keys="P" label="Place location" />
            <Shortcut keys="Z" label="Draw zone" />
            <Shortcut keys="E" label="Edit polygons" />
            <Shortcut keys="F" label="Toggle filters" />
            <Shortcut keys="Esc" label="Close / cancel" />
          </ul>
        </section>
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <kbd className="rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">{keys}</kbd>
      <span>{label}</span>
    </li>
  );
}