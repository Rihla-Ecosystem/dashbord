"use client";

import { useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
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
import { nearbyServiceMeta } from "@/constants/geocontext";
import { useGeoWorkspace } from "../workspace-context";

export function NearbyPanel() {
  const ws = useGeoWorkspace();
  const services = useMemo(
    () => ws.locations.flatMap((l) => l.nearby.map((s) => ({ ...s, locationName: l.nameEn }))),
    [ws.locations]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-sky-500" />
          <span className="font-semibold">{services.length} services</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {ws.isLocationsLoading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : services.length === 0 ? (
          <EmptyState
            title="No nearby services"
            description="Register nearby services (hospitals, embassies, pharmacies…) on a location."
            icon={<Navigation className="size-7" />}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const meta = nearbyServiceMeta(service.type);
                  return (
                    <TableRow key={service.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                            <MapPin className="size-3.5" />
                          </span>
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{service.locationName}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{meta.label}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex items-center gap-1 text-sm">
                          <Navigation className="size-3.5 text-muted-foreground" />
                          {service.distanceKm.toFixed(1)} km
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {service.rating !== undefined ? `★ ${service.rating.toFixed(1)}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}