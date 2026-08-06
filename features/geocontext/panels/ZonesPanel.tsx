"use client";

import { Landmark, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/LoadingSpinner";
import { RiskBadge, LayerPill } from "../badges";
import { useGeoWorkspace } from "../workspace-context";

export function ZonesPanel() {
  const ws = useGeoWorkspace();
  const zones = ws.zones;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => ws.setDrawMode(ws.drawMode === "zone" ? null : "zone")}
          className={ws.drawMode === "zone" ? "border-primary text-primary" : ""}
        >
          <Plus className="size-4" />
          Draw zone
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ws.setEditZonesMode(!ws.editZonesMode)}
          className={ws.editZonesMode ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : ""}
          disabled={zones.length === 0}
        >
          <Pencil className="size-4" />
          {ws.editZonesMode ? "Editing…" : "Edit polygons"}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">{zones.length} zones</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {ws.isLocationsLoading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : zones.length === 0 ? (
          <EmptyState
            title="No restricted zones"
            description="Draw a restricted-zone polygon on the map to start building your safety layer."
            icon={<ShieldAlert className="size-7" />}
            action={{
              label: "Draw zone",
              onClick: () => ws.setDrawMode("zone"),
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id} className="cur-draggable hover:bg-muted/20" onClick={() => ws.openZone(zone, "view")}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <ShieldAlert className="size-3.5" />
                        </span>
                        <button className="text-left hover:text-primary">{zone.name}</button>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap capitalize text-muted-foreground">{zone.restrictionType.replace("_", " ")}</TableCell>
                    <TableCell className="whitespace-nowrap"><RiskBadge level={zone.riskLevel} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      <LayerPill
                        label={zone.active ? "Active" : "Inactive"}
                        tone={zone.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{zone.source ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Locate on map"
                          onClick={(e) => { e.stopPropagation(); ws.openZone(zone, "view"); }}
                        >
                          <Landmark className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Edit zone"
                          disabled={!ws.canEdit}
                          onClick={(e) => { e.stopPropagation(); ws.openZone(zone, "edit"); }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Delete"
                          disabled={!ws.canDelete}
                          onClick={(e) => { e.stopPropagation(); ws.requestDelete({ kind: "zone", name: zone.name, id: zone.id }); }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}