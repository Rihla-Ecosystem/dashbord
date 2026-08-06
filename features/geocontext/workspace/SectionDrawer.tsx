"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useGeoWorkspace, type WorkspaceSection } from "../workspace-context";

const OverviewPanel = dynamic(() => import("../panels/OverviewPanel").then((m) => m.OverviewPanel), { ssr: false });
const LocationsPanel = dynamic(() => import("../panels/LocationsPanel").then((m) => m.LocationsPanel), { ssr: false });
const ZonesPanel = dynamic(() => import("../panels/ZonesPanel").then((m) => m.ZonesPanel), { ssr: false });
const WarningsPanel = dynamic(() => import("../panels/WarningsPanel").then((m) => m.WarningsPanel), { ssr: false });
const NearbyPanel = dynamic(() => import("../panels/NearbyPanel").then((m) => m.NearbyPanel), { ssr: false });
const AnalyticsPanel = dynamic(() => import("../panels/AnalyticsPanel").then((m) => m.AnalyticsPanel), { ssr: false });
const AuditLogsPanel = dynamic(() => import("../panels/AuditLogsPanel").then((m) => m.AuditLogsPanel), { ssr: false });
const SettingsPanel = dynamic(() => import("../panels/SettingsPanel").then((m) => m.SettingsPanel), { ssr: false });

export const SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: "Overview",
  map: "Interactive Map",
  locations: "Locations",
  zones: "Restricted Areas",
  warnings: "Warnings",
  nearby: "Nearby Services",
  analytics: "Analytics",
  activity: "Audit Logs",
  settings: "Settings",
};

const PANELS: Record<Exclude<WorkspaceSection, "map">, ComponentType> = {
  overview: OverviewPanel,
  locations: LocationsPanel,
  zones: ZonesPanel,
  warnings: WarningsPanel,
  nearby: NearbyPanel,
  analytics: AnalyticsPanel,
  activity: AuditLogsPanel,
  settings: SettingsPanel,
};

/**
 * Section panels (Analytics, Locations, Activity, …) slide in from the right as a
 * drawer, keeping the map as the persistent centre of the workspace.
 */
export function SectionDrawer() {
  const ws = useGeoWorkspace();
  const { section } = ws;
  const isSection = section !== "map";
  const open = isSection && !ws.drawerOpen;

  const Panel = isSection ? PANELS[section as Exclude<WorkspaceSection, "map">] : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) ws.setSection("map");
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-[46rem]"
      >
        {Panel && (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
              <SheetTitle className="text-sm font-semibold">{SECTION_LABELS[section]}</SheetTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => ws.setSection("map")}
                aria-label="Close panel"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Panel />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
