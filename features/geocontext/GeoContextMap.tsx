"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useTheme } from "next-themes";
import {
  Compass,
  Expand,
  LocateFixed,
  Maximize2,
  Sparkles,
  Wind,
  CloudSun,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  categoryMeta,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  severityMeta,
  TILE_URLS,
} from "@/constants/geocontext";
import { RiskHeatLayer, type HeatPoint } from "./map/heat-layer";
import type { Boundary, GeoCoordinates, GeoLocation, RestrictedZone } from "@/types/geocontext";

import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MapDrawMode = "zone" | "boundary" | "location" | null;

export interface GeoContextMapProps {
  locations: GeoLocation[];
  zones: RestrictedZone[];
  boundaries: Boundary[];
  visibleLayers: Record<string, boolean>;
  selectedLocationId: string | null;
  drawMode: MapDrawMode;
  heatPoints: HeatPoint[];
  onSelectLocation: (id: string) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  onPolygonDrawn: (coords: GeoCoordinates[]) => void;
  className?: string;
}

const WEATHER_STATIONS: Array<{ city: string; lat: number; lng: number; temp: number; condition: string }> = [
  { city: "Cairo", lat: 30.0444, lng: 31.2357, temp: 29, condition: "Partly cloudy" },
  { city: "Alexandria", lat: 31.2001, lng: 29.9187, temp: 26, condition: "Clear" },
  { city: "Luxor", lat: 25.6872, lng: 32.6396, temp: 38, condition: "Sunny" },
  { city: "Aswan", lat: 24.0889, lng: 32.8998, temp: 40, condition: "Sunny" },
  { city: "Hurghada", lat: 27.2579, lng: 33.8116, temp: 33, condition: "Clear" },
  { city: "Sharm El-Sheikh", lat: 27.9158, lng: 34.33, temp: 32, condition: "Clear" },
];

const TRAFFIC_ROUTES: Array<[number, number][]> = [
  [
    [30.0444, 31.2357],
    [30.0525, 31.275],
  ],
  [
    [29.99, 31.2],
    [30.03, 31.24],
  ],
  [
    [30.08, 31.3],
    [30.06, 31.34],
  ],
];

function pinIcon(color: string, selected: boolean, warning: boolean): L.DivIcon {
  const size = selected ? 40 : 30;
  const stroke = warning ? "#dc2626" : selected ? "#0b6f6b" : "#ffffff";
  return L.divIcon({
    className: "rihla-marker",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        <svg width="${size}" height="${size + 10}" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
          <path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 34 12 34s12-14 12-22.4C24 5.2 18.6 0 12 0z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="12" cy="11.5" r="4.2" fill="#ffffff" opacity="0.95"/>
        </svg>
      </div>`,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -size - 6],
  });
}

function warningIcon(severityColor: string): L.DivIcon {
  return L.divIcon({
    className: "rihla-warning-icon",
    html: `
      <div style="position:relative;width:22px;height:22px">
        <svg width="22" height="22" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">
          <path d="M10.3 3.7 1.8 18c-.5.9.1 2 1.1 2h18.2c1 0 1.6-1.1 1.1-2L13.7 3.7c-.5-.9-1.9-.9-2.4 0z" fill="${severityColor}" stroke="#fff" stroke-width="1"/>
          <rect x="11" y="8" width="2" height="6" fill="#fff" rx="1"/>
          <circle cx="12" cy="17" r="1.3" fill="#fff"/>
        </svg>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 20],
  });
}

function ThemeTiles() {
  const { resolvedTheme } = useTheme();
  return <TileLayer url={resolvedTheme === "dark" ? TILE_URLS.dark : TILE_URLS.light} />;
}

function MapClickCapture({ onMapClick, enabled }: { onMapClick: GeoContextMapProps["onMapClick"]; enabled: boolean }) {
  useMapEvents({
    click: (e) => {
      if (enabled) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function DrawController({
  mode,
  onPolygonDrawn,
}: {
  mode: MapDrawMode;
  onPolygonDrawn: (coords: GeoCoordinates[]) => void;
}) {
  const map = useMap();
  const active = mode === "zone" || mode === "boundary";

  useEffect(() => {
    if (!active) return;
    const featureGroup = new L.FeatureGroup();
    map.addLayer(featureGroup);

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: "#0b6f6b" } },
        rectangle: { shapeOptions: { color: "#0b6f6b" } },
        circle: { shapeOptions: { color: "#0b6f6b" } },
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: { featureGroup },
    });
    drawControl.addTo(map);

    const onCreated = (e: L.LeafletEvent) => {
      const event = e as unknown as { layer: L.Layer; layerType: string };
      const layer = event.layer as L.Polygon & { getLatLngs?: () => unknown };
      featureGroup.addLayer(event.layer as L.Layer);
      if (event.layerType === "circle") {
        const circle = layer as unknown as L.Circle;
        const latlng = circle.getLatLng();
        const radius = circle.getRadius();
        const points: GeoCoordinates[] = [];
        for (let i = 0; i < 24; i += 1) {
          const angle = (i / 24) * Math.PI * 2;
          points.push({
            lat: latlng.lat + (radius / 111320) * Math.cos(angle),
            lng: latlng.lng + (radius / (111320 * Math.max(0.2, Math.cos((latlng.lat * Math.PI) / 180)))) * Math.sin(angle),
          });
        }
        onPolygonDrawn(points);
        return;
      }
      const raw = layer.getLatLngs?.();
      const ring = Array.isArray(raw) && Array.isArray((raw as unknown[])[0]) ? (raw as unknown[])[0] : (raw as unknown[]);
      const coords: GeoCoordinates[] = (ring as L.LatLng[]).map((ll) => ({ lat: ll.lat, lng: ll.lng }));
      if (coords.length >= 3) onPolygonDrawn(coords);
    };

    map.on("draw:created", onCreated as L.LeafletEventHandlerFn);
    return () => {
      map.off("draw:created", onCreated as L.LeafletEventHandlerFn);
      map.removeControl(drawControl);
      map.removeLayer(featureGroup);
    };
  }, [map, active, onPolygonDrawn]);

  return null;
}

function LocationMarker({
  location,
  selected,
  visibleWarnings,
  onClick,
}: {
  location: GeoLocation;
  selected: boolean;
  visibleWarnings: boolean;
  onClick: (id: string) => void;
}) {
  const meta = categoryMeta(location.category);
  const hasWarning = location.warnings.some((w) => w.active);
  const icon = pinIcon(meta.color, selected, hasWarning);
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{ click: () => onClick(location.id) }}
    >
      <Popup>
        <div className="min-w-[160px] space-y-1 text-sm">
          <p className="font-semibold">{location.nameEn}</p>
          <p className="text-xs capitalize text-muted-foreground">{meta.label}</p>
          <p className="text-xs text-muted-foreground">
            {location.city}, {location.governorate}
          </p>
          {visibleWarnings && hasWarning && (
            <p className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-3.5" />
              {location.warnings.filter((w) => w.active).length} active warning(s)
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function WarningMarkers({ locations, onClick }: { locations: GeoLocation[]; onClick: (id: string) => void }) {
  const rank: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return (
    <>
      {locations.map((location) => {
        const active = location.warnings.filter((w) => w.active);
        if (!active.length) return null;
        const top = active.reduce((max, w) => (rank[w.severity] > rank[max.severity] ? w : max));
        return (
          <Marker
            key={`warn-${location.id}`}
            position={[location.lat + 0.015, location.lng + 0.015]}
            icon={warningIcon(severityMeta(top.severity).color)}
            eventHandlers={{ click: () => onClick(location.id) }}
          />
        );
      })}
    </>
  );
}

function HeatLayerComponent({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const layerRef = useRef<RiskHeatLayer | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = new RiskHeatLayer(points);
      map.addLayer(layerRef.current);
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    layerRef.current?.setPoints(points);
  }, [points]);

  return null;
}

function MapTools() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), 13));
          L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
            radius: 8,
            color: "#0b6f6b",
            fillColor: "#0b6f6b",
            fillOpacity: 0.6,
          }).addTo(map);
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 8000 }
      );
    } else {
      setLocating(false);
    }
  };

  const fullscreen = () => {
    const container = map.getContainer();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  };

  return (
    <div className="absolute bottom-4 right-3 z-[500] flex flex-col gap-2">
      <Button variant="outline" size="icon-sm" className="rounded-xl bg-background/90 shadow-md backdrop-blur" onClick={locate} title="My location" aria-label="My location">
        {locating ? <Compass className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
      </Button>
      <Button variant="outline" size="icon-sm" className="rounded-xl bg-background/90 shadow-md backdrop-blur" onClick={fullscreen} title="Fullscreen" aria-label="Fullscreen">
        {document.fullscreenElement ? <Maximize2 className="size-4" /> : <Expand className="size-4" />}
      </Button>
    </div>
  );
}

function SelectedBounds({ locations, selectedId }: { locations: GeoLocation[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (loc) map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 12));
  }, [selectedId, locations, map]);
  return null;
}

export function GeoContextMap({
  locations,
  zones,
  boundaries,
  visibleLayers,
  selectedLocationId,
  drawMode,
  heatPoints,
  onSelectLocation,
  onMapClick,
  onPolygonDrawn,
  className,
}: GeoContextMapProps) {
  const markerCategories = useMemo(() => {
    const set = new Set<string>();
    Object.entries(visibleLayers).forEach(([id, visible]) => {
      if (!visible) return;
      if (id === "tourist_attractions") ["attraction", "historical", "museum", "mosque", "park", "beach"].forEach((c) => set.add(c));
      if (id === "photography_restricted") set.add("restricted");
      if (id === "hotels") set.add("hotel");
      if (id === "restaurants") set.add("restaurant");
      if (id === "hospitals") set.add("hospital");
      if (id === "police_stations") set.add("police");
      if (id === "pharmacies") set.add("pharmacy");
      if (id === "transportation") set.add("transportation");
      if (id === "atms") set.add("atm");
      if (id === "embassies") set.add("embassy");
    });
    return set;
  }, [visibleLayers]);

  const markerLocations = useMemo(() => locations.filter((l) => markerCategories.has(l.category)), [locations, markerCategories]);
  const warningLocations = visibleLayers.warnings ? locations.filter((l) => l.warnings.some((w) => w.active)) : [];
  const visibleZones = useMemo(
    () =>
      zones.filter((z) =>
        visibleLayers.restricted_areas
          ? z.restrictionType !== "military"
          : visibleLayers.military_zones
            ? z.restrictionType === "military"
            : false
      ),
    [zones, visibleLayers]
  );
  const aiLocations = visibleLayers.ai_recommendations ? locations.filter((l) => l.safetyScore < 75) : [];

  return (
    <div className={cn("relative h-full min-h-[420px] overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        zoomControl
        attributionControl
        className="h-full w-full"
        style={{ background: "#dbeafe", minHeight: 420 }}
      >
        <ThemeTiles />
        <MapClickCapture onMapClick={onMapClick} enabled={drawMode !== "zone" && drawMode !== "boundary"} />
        <DrawController mode={drawMode} onPolygonDrawn={onPolygonDrawn} />

        {visibleLayers.boundaries &&
          boundaries.map((b) => (
            <Polygon
              key={`b-${b.id}`}
              positions={b.polygon.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: "#6366f1", weight: 2, fillColor: "#6366f1", fillOpacity: 0.04, dashArray: "6 4" }}
            >
              <Popup>{b.name}</Popup>
            </Polygon>
          ))}

        {visibleZones.map((zone) => {
          const isMilitary = zone.restrictionType === "military";
          const color = isMilitary ? "#dc2626" : zone.riskLevel === "extreme" ? "#7f1d1d" : "#f59e0b";
          return (
            <Polygon
              key={`z-${zone.id}`}
              positions={zone.polygon.map((p) => [p.lat, p.lng])}
              pathOptions={{ color, weight: 2.5, fillColor: color, fillOpacity: 0.12, dashArray: isMilitary ? "8 6" : undefined }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.restrictionType.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">Risk: {zone.riskLevel}</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {visibleLayers.weather_layer &&
          WEATHER_STATIONS.map((station) => (
            <CircleMarker
              key={station.city}
              center={[station.lat, station.lng]}
              radius={10}
              pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.5 }}
            >
              <Popup>
                <div className="flex items-center gap-2 text-sm">
                  <CloudSun className="size-4 text-sky-500" />
                  <div>
                    <p className="font-semibold">{station.city}</p>
                    <p className="text-xs text-muted-foreground">
                      {station.temp}°C · {station.condition}
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {visibleLayers.traffic_layer &&
          TRAFFIC_ROUTES.map((route, i) => (
            <Polyline key={`traffic-${i}`} positions={route} pathOptions={{ color: "#0b6f6b", weight: 4, opacity: 0.55 }} />
          ))}

        {visibleLayers.ai_recommendations &&
          aiLocations.map((l) => (
            <Marker
              key={`ai-${l.id}`}
              position={[l.lat - 0.02, l.lng + 0.02]}
              icon={L.divIcon({
                className: "",
                html: `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:#8b5cf6;color:#fff;border-radius:9999px;box-shadow:0 1px 3px rgba(0,0,0,.4)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/></svg></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="size-4 text-violet-500" />
                  <div>
                    <p className="font-semibold">AI recommendation</p>
                    <p className="text-xs text-muted-foreground">Improve safety at {l.nameEn}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {visibleLayers.risk_heatmap && <HeatLayerComponent points={heatPoints} />}

        {warningLocations.length > 0 && <WarningMarkers locations={warningLocations} onClick={onSelectLocation} />}

        {markerLocations.length > 0 && (
          <MarkerClusterGroup chunkedLoading polygonOptions={{ color: "#0b6f6b" }}>
            {markerLocations.map((location) => (
              <LocationMarker
                key={location.id}
                location={location}
                selected={location.id === selectedLocationId}
                visibleWarnings={visibleLayers.warnings}
                onClick={onSelectLocation}
              />
            ))}
          </MarkerClusterGroup>
        )}

        <MapTools />
        <SelectedBounds locations={locations} selectedId={selectedLocationId} />
      </MapContainer>

      {drawMode === "zone" && (
        <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-xl bg-amber-500/95 px-3 py-2 text-xs font-medium text-white shadow-lg">
          <Wind className="size-4" />
          Draw a polygon on the map to define the restricted zone
        </div>
      )}
      {drawMode === "boundary" && (
        <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-xl bg-indigo-500/95 px-3 py-2 text-xs font-medium text-white shadow-lg">
          <Maximize2 className="size-4" />
          Draw the boundary polygon on the map
        </div>
      )}
    </div>
  );
}
