"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  Compass,
  Crosshair,
  Expand,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Minus,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  CloudSun,
  Loader2,
  Navigation,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BASEMAPS,
  DEFAULT_BASEMAP,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  EGYPT_BBOX,
  EGYPT_MAX_ZOOM,
  EGYPT_MIN_ZOOM,
  EGYPT_WEATHER_CITIES,
  basemapById,
  categoryMeta,
  severityMeta,
  type BasemapDef,
  type BasemapId,
} from "@/constants/geocontext";
import { fetchWeather, weatherDescription } from "./weather";
import { geocodeAddress, parseCoordinateQuery, type GeocodeResult } from "./geoUtils";
import { RiskHeatLayer, type HeatPoint } from "./map/heat-layer";
import {
  boundsToRing,
  circleToRing,
  centroidOfParts,
  extractRing,
  findSnap,
  pointGeometry,
  polygonGeometry,
  type DraftGeometry,
  type DraftPart,
} from "./drawing/geometry";
import type { Boundary, GeoCoordinates, GeoLocation, RestrictedZone } from "@/types/geocontext";

type GCoords = GeoCoordinates;

import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MapDrawMode = "point" | "polygon" | "rectangle" | "circle" | "multipolygon" | "zone" | "boundary" | null;

export interface MapPoint {
  x: number;
  y: number;
}

export interface GeoContextMapProps {
  locations: GeoLocation[];
  zones: RestrictedZone[];
  boundaries: Boundary[];
  visibleLayers: Record<string, boolean>;
  selectedLocationId: string | null;
  selectedZoneId?: string | null;
  selectedBoundaryId?: string | null;
  drawMode: MapDrawMode;
  editMode?: boolean;
  editZonesMode?: boolean;
  basemap?: BasemapId;
  onBasemapChange?: (id: BasemapId) => void;
  heatPoints: HeatPoint[];
  onSelectLocation: (id: string) => void;
  onSelectZone?: (id: string) => void;
  onSelectBoundary?: (id: string) => void;
  /** A shape was completed with the active draw tool. */
  onGeometryDrawn: (geometry: DraftGeometry) => void;
  /** One part of a multi-polygon was completed (multipolygon mode keeps active). */
  onMultiPartDrawn?: (ring: GeoCoordinates[]) => void;
  /** The user moved/resized/edited the draft geometry directly on the map. */
  onDraftGeometryChange?: (geometry: DraftGeometry | null) => void;
  onZonePolygonEdited?: (id: string, coords: GeoCoordinates[]) => void;
  onLocationContextMenu?: (location: GeoLocation, point: MapPoint) => void;
  onZoneContextMenu?: (zone: RestrictedZone, point: MapPoint) => void;
  /** External command handle; when omitted the map creates its own internal ref. */
  commandRef?: React.MutableRefObject<MapCommand | null>;
  className?: string;
}

export interface MapCommand {
  flyTo: (latlng: { lat: number; lng: number }, zoom?: number) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  fullscreen: () => void;
  /** Imperatively replace the draft geometry overlay (create/edit/undo/redo). */
  setDraftGeometry: (geometry: DraftGeometry | null) => void;
  /** Read the current draft geometry from the editable overlay. */
  getDraftGeometry: () => DraftGeometry | null;
  /** Remove the draft overlay. */
  clearDraftGeometry: () => void;
}

function pinIcon(color: string, selected: boolean, warning: boolean): L.DivIcon {
  const size = selected ? 42 : 32;
  const stroke = warning ? "#dc2626" : selected ? "#0b6f6b" : "#ffffff";
  return L.divIcon({
    className: "rihla-marker",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;transition:transform .15s ease">
        <svg width="${size}" height="${size + 10}" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">
          <path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 34 12 34s12-14 12-22.4C24 5.2 18.6 0 12 0z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="12" cy="11.5" r="4.2" fill="#ffffff" opacity="0.95"/>
        </svg>
      </div>`,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -size - 6],
  });
}

function draftPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:34px;height:44px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">
        <svg width="34" height="44" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 34 12 34s12-14 12-22.4C24 5.2 18.6 0 12 0z" fill="#0b6f6b" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="12" cy="11.5" r="4.2" fill="#ffffff" opacity="0.95"/>
        </svg>
      </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 40],
  });
}

function warningIcon(severityColor: string): L.DivIcon {
  return L.divIcon({
    className: "rihla-warning-icon",
    html: `
      <div style="position:relative;width:24px;height:24px">
        <svg width="24" height="24" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">
          <path d="M10.3 3.7 1.8 18c-.5.9.1 2 1.1 2h18.2c1 0 1.6-1.1 1.1-2L13.7 3.7c-.5-.9-1.9-.9-2.4 0z" fill="${severityColor}" stroke="#fff" stroke-width="1"/>
          <rect x="11" y="8" width="2" height="6" fill="#fff" rx="1"/>
          <circle cx="12" cy="17" r="1.3" fill="#fff"/>
        </svg>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 20],
  });
}

function BaseLayers({ basemap }: { basemap: BasemapDef }) {
  return (
    <>
      <TileLayer url={basemap.url} maxZoom={EGYPT_MAX_ZOOM} />
      {basemap.overlays?.map((url) => (
        <TileLayer key={url} url={url} maxZoom={EGYPT_MAX_ZOOM} />
      ))}
    </>
  );
}

// -----------------------------------------------------------------------------
// Drawing + draft geometry controller
// -----------------------------------------------------------------------------

function readDraftFromFeatureGroup(fg: L.FeatureGroup | null): DraftGeometry | null {
  if (!fg) return null;
  const parts: DraftPart[] = [];
  fg.eachLayer((layer) => {
    const l = layer as L.Layer & { getLatLng?: () => L.LatLng; getLatLngs?: () => unknown };
    if (l instanceof L.Marker) {
      const p = l.getLatLng();
      parts.push({ type: "point", coords: [{ lat: p.lat, lng: p.lng }] });
    } else if (typeof l.getLatLngs === "function") {
      parts.push({ type: "polygon", coords: extractRing(l.getLatLngs() as L.LatLng[]) });
    }
  });
  if (!parts.length) return null;
  return { parts, centroid: centroidOfParts(parts) };
}

function attachVertexSnap(fg: L.FeatureGroup, snapPoints: GCoords[], map: L.Map) {
  if (!snapPoints.length) return;
  const applySnap = (marker: L.Marker) => {
    marker.on("drag", () => {
      const latlng = marker.getLatLng();
      const snapped = findSnap({ lat: latlng.lat, lng: latlng.lng }, snapPoints, 30);
      if (snapped) marker.setLatLng(snapped);
    });
  };
  const hook = () => {
    fg.eachLayer((layer) => {
      const editing = (layer as L.Polygon & { editing?: { _verticesHandlers?: Array<{ _vertexMarkers?: L.Marker[] }> } }).editing;
      if (!editing) return;
      editing._verticesHandlers?.forEach((h) => h._vertexMarkers?.forEach(applySnap));
    });
  };
  hook();
  map.on("draw:editstart", hook);
  map.on("draw:editvertex", hook);
}

function DrawingController({
  drawMode,
  editMode,
  snapPoints,
  onGeometryDrawn,
  onMultiPartDrawn,
  onDraftGeometryChange,
  commandRef,
}: {
  drawMode: MapDrawMode;
  editMode: boolean;
  snapPoints: GCoords[];
  onGeometryDrawn: (geometry: DraftGeometry) => void;
  onMultiPartDrawn?: (ring: GeoCoordinates[]) => void;
  onDraftGeometryChange?: (geometry: DraftGeometry | null) => void;
  commandRef: React.MutableRefObject<MapCommand | null>;
}) {
  const map = useMap();
  const fgRef = useRef<L.FeatureGroup | null>(null);
  const editRef = useRef<{ disable: () => void } | null>(null);
  const editModeRef = useRef(editMode);
  const snapRef = useRef(snapPoints);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);
  useEffect(() => {
    snapRef.current = snapPoints;
  }, [snapPoints]);

  // --- active draw tool ---
  useEffect(() => {
    if (!drawMode) return;
    const opts = {
      shapeOptions: { color: "#0b6f6b", weight: 2, fillColor: "#0b6f6b", fillOpacity: 0.15 },
    };
    let handler:
      | L.Draw.Polygon
      | L.Draw.Rectangle
      | L.Draw.Circle
      | L.Draw.Marker
      | null = null;
    const drawMap = map as unknown as L.DrawMap;
    if (drawMode === "point") {
      handler = new L.Draw.Marker(drawMap, { icon: draftPinIcon() });
    } else if (drawMode === "rectangle") {
      handler = new L.Draw.Rectangle(drawMap, opts);
    } else if (drawMode === "circle") {
      handler = new L.Draw.Circle(drawMap, { ...opts, showRadius: true, metric: true });
    } else {
      handler = new L.Draw.Polygon(drawMap, { ...opts, allowIntersection: false, showArea: true });
    }
    handler.enable();
    return () => {
      handler?.disable();
    };
  }, [drawMode, map]);

  // --- shape completion ---
  useEffect(() => {
    const onCreated = (e: L.LeafletEvent) => {
      const event = e as unknown as { layer: L.Layer & { getLatLng?: () => L.LatLng; getRadius?: () => number; getBounds?: () => L.LatLngBounds; getLatLngs?: () => unknown }; layerType: string };
      const layer = event.layer;
      if (drawMode === "point") {
        const p = layer.getLatLng?.();
        if (p) onGeometryDrawn(pointGeometry({ lat: p.lat, lng: p.lng }));
      } else if (drawMode === "circle") {
        const c = layer.getLatLng?.();
        const radius = layer.getRadius?.();
        if (c && radius !== undefined) {
          onGeometryDrawn(polygonGeometry(circleToRing({ lat: c.lat, lng: c.lng }, radius)));
        }
      } else if (drawMode === "rectangle") {
        const b = layer.getBounds?.();
        if (b) {
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          onGeometryDrawn(
            polygonGeometry(
              boundsToRing({ lat: sw.lat, lng: sw.lng }, { lat: ne.lat, lng: ne.lng })
            )
          );
        }
      } else if (drawMode === "multipolygon") {
        const latlngs = layer.getLatLngs?.();
        if (latlngs) onMultiPartDrawn?.(extractRing(latlngs as L.LatLng[]));
      } else {
        const latlngs = layer.getLatLngs?.();
        if (latlngs) onGeometryDrawn(polygonGeometry(extractRing(latlngs as L.LatLng[])));
      }
    };
    map.on("draw:created", onCreated as L.LeafletEventHandlerFn);
    return () => {
      map.off("draw:created", onCreated as L.LeafletEventHandlerFn);
    };
  }, [map, drawMode, onGeometryDrawn, onMultiPartDrawn]);

  // --- rebuild overlay layers from a geometry ---
  const rebuildLayers = useCallback(
    (geometry: DraftGeometry | null) => {
      if (editRef.current) {
        editRef.current.disable();
        editRef.current = null;
      }
      if (fgRef.current) {
        map.removeLayer(fgRef.current);
        fgRef.current = null;
      }
      if (!geometry || geometry.parts.length === 0) return;
      const fg = new L.FeatureGroup();
      geometry.parts.forEach((part) => {
        if (part.type === "point" && part.coords[0]) {
          fg.addLayer(
            L.marker([part.coords[0].lat, part.coords[0].lng], {
              icon: draftPinIcon(),
              draggable: true,
            })
          );
        } else if (part.type === "polygon" && part.coords.length >= 3) {
          fg.addLayer(
            L.polygon(
              part.coords.map((p) => [p.lat, p.lng] as [number, number]),
              { color: "#0b6f6b", weight: 2, fillColor: "#0b6f6b", fillOpacity: 0.15 }
            )
          );
        }
      });
      map.addLayer(fg);
      fgRef.current = fg;
      if (editModeRef.current && fg.getLayers().length) {
        const edit = new (L as unknown as { EditToolbar: { Edit: new (m: L.Map, o: object) => { enable: () => void; disable: () => void } } }).EditToolbar.Edit(map, {
          featureGroup: fg,
          edit: {
            move: true,
            selectedPathOptions: { color: "#0b6f6b", fillColor: "#0b6f6b", fillOpacity: 0.3 },
          },
          remove: false,
        });
        edit.enable();
        editRef.current = edit;
        attachVertexSnap(fg, snapRef.current, map);
      }
    },
    [map]
  );

  // --- toggle edit mode on the existing overlay ---
  useEffect(() => {
    if (!fgRef.current) return;
    if (editMode) {
      if (!editRef.current) {
        const edit = new (L as unknown as { EditToolbar: { Edit: new (m: L.Map, o: object) => { enable: () => void; disable: () => void } } }).EditToolbar.Edit(map, {
          featureGroup: fgRef.current,
          edit: {
            move: true,
            selectedPathOptions: { color: "#0b6f6b", fillColor: "#0b6f6b", fillOpacity: 0.3 },
          },
          remove: false,
        });
        edit.enable();
        editRef.current = edit;
        attachVertexSnap(fgRef.current, snapRef.current, map);
      }
    } else if (editRef.current) {
      editRef.current.disable();
      editRef.current = null;
    }
  }, [editMode, map]);

  // --- register draft commands on the shared command handle ---
  useEffect(() => {
    const prev = commandRef.current ?? null;
    commandRef.current = {
      ...(prev ?? ({} as MapCommand)),
      getDraftGeometry: () => readDraftFromFeatureGroup(fgRef.current),
      setDraftGeometry: (g) => rebuildLayers(g),
      clearDraftGeometry: () => rebuildLayers(null),
    };
  }, [commandRef, rebuildLayers]);

  // --- emit live geometry changes when the user edits on the map ---
  useEffect(() => {
    const emit = () => {
      if (fgRef.current) onDraftGeometryChange?.(readDraftFromFeatureGroup(fgRef.current));
    };
    map.on("draw:edited", emit);
    map.on("draw:editmove", emit);
    map.on("draw:editvertex", emit);
    return () => {
      map.off("draw:edited", emit);
      map.off("draw:editmove", emit);
      map.off("draw:editvertex", emit);
    };
  }, [map, onDraftGeometryChange]);

  return null;
}

/** Edit mode for existing restricted-zone polygons using leaflet-draw's edit toolbar. */
function EditZonesController({
  zones,
  active,
  onEdited,
}: {
  zones: RestrictedZone[];
  active: boolean;
  onEdited: (id: string, coords: GeoCoordinates[]) => void;
}) {
  const map = useMap();
  const onEditedRef = useRef(onEdited);
  useEffect(() => {
    onEditedRef.current = onEdited;
  }, [onEdited]);

  useEffect(() => {
    if (!active) return;
    const featureGroup = new L.FeatureGroup();
    const idByLayer = new Map<L.Layer, string>();
    zones.forEach((zone) => {
      if (zone.polygon.length < 3) return;
      const layer = L.polygon(zone.polygon.map((p) => [p.lat, p.lng] as [number, number]), {
        color: "#0b6f6b",
        weight: 2,
        fillOpacity: 0.06,
        dashArray: "6 4",
      });
      idByLayer.set(layer, zone.id);
      featureGroup.addLayer(layer);
    });
    map.addLayer(featureGroup);

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polyline: false,
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup },
    });
    drawControl.addTo(map);

    const onEditedEvt = (e: L.LeafletEvent) => {
      const event = e as unknown as { layers: { eachLayer: (fn: (l: L.Layer) => void) => void } };
      event.layers.eachLayer((layer) => {
        const id = idByLayer.get(layer);
        const poly = layer as L.Polygon;
        const coords: GeoCoordinates[] = extractRing(poly.getLatLngs() as L.LatLng[]);
        if (id && coords.length >= 3) onEditedRef.current(id, coords);
      });
    };

    map.on("draw:edited", onEditedEvt as L.LeafletEventHandlerFn);
    return () => {
      map.off("draw:edited", onEditedEvt as L.LeafletEventHandlerFn);
      map.removeControl(drawControl);
      map.removeLayer(featureGroup);
    };
  }, [map, active, zones]);

  return null;
}

function LocationMarker({
  location,
  selected,
  visibleWarnings,
  onClick,
  onContextMenu,
}: {
  location: GeoLocation;
  selected: boolean;
  visibleWarnings: boolean;
  onClick: (id: string) => void;
  onContextMenu?: (location: GeoLocation, point: MapPoint) => void;
}) {
  const meta = categoryMeta(location.category);
  const hasWarning = location.warnings.some((w) => w.active);
  const icon = pinIcon(meta.color, selected, hasWarning);
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(location.id),
        contextmenu: (e) => {
          if (onContextMenu) {
            const oe = e.originalEvent as MouseEvent;
            onContextMenu(location, { x: oe.clientX, y: oe.clientY });
          }
        },
      }}
    >
      <Popup>
        <div className="min-w-[180px] space-y-1 text-sm">
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

function useCityWeather() {
  return useQuery({
    queryKey: ["geocontext", "weather", "egypt"],
    queryFn: async () => {
      const results = await Promise.all(
        EGYPT_WEATHER_CITIES.map(async (city) => {
          const w = await fetchWeather(city.lat, city.lng);
          return w ? { city: city.name, lat: city.lat, lng: city.lng, ...w } : null;
        })
      );
      return results.filter((r): r is NonNullable<typeof r> => !!r);
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: [],
  });
}

function WeatherLayer() {
  const { data: readings } = useCityWeather();
  if (!readings?.length) return null;
  return (
    <>
      {readings.map((r) => (
        <CircleMarker
          key={r.city}
          center={[r.lat, r.lng]}
          radius={9}
          pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.85 }}
        >
          <Popup>
            <div className="flex items-center gap-2 text-sm">
              <CloudSun className="size-4 text-sky-500" />
              <div>
                <p className="font-semibold">{r.city}</p>
                <p className="text-xs text-muted-foreground">
                  {r.temperature.toFixed(1)}°C · {weatherDescription(r.weatherCode)} · {r.windSpeed.toFixed(1)} km/h
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

function MapCommandProvider({
  commandRef,
  externalRef,
}: {
  commandRef: React.MutableRefObject<MapCommand | null>;
  externalRef?: React.MutableRefObject<MapCommand | null>;
}) {
  const map = useMap();
  useEffect(() => {
    const locate = () => {
      if (!navigator.geolocation) return;
      map.locate({ setView: false, maxZoom: 15, timeout: 8000 });
    };
    const fullscreen = () => {
      const container = map.getContainer();
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void container.requestFullscreen?.();
      }
    };
    const handle: MapCommand = {
      flyTo: (latlng, zoom = Math.max(map.getZoom(), 12)) => {
        map.flyTo([latlng.lat, latlng.lng], zoom, { duration: 0.9 });
      },
      resetView: () => map.flyTo([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM, { duration: 1 }),
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      locate,
      fullscreen,
      getDraftGeometry: () => null,
      setDraftGeometry: () => undefined,
      clearDraftGeometry: () => undefined,
    };
    commandRef.current = handle;
    if (externalRef) externalRef.current = handle;
    map.on("locationfound", onLocated);
    map.on("locationerror", onLocateError);
    function onLocated(e: L.LocationEvent) {
      map.flyTo([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 13), { duration: 0.9 });
      L.circle([e.latlng.lat, e.latlng.lng], { radius: e.accuracy, color: "#0b6f6b", fillColor: "#0b6f6b", fillOpacity: 0.08 }).addTo(map);
      L.circleMarker([e.latlng.lat, e.latlng.lng], { radius: 8, color: "#0b6f6b", fillColor: "#0b6f6b", fillOpacity: 0.6 }).addTo(map);
    }
    function onLocateError() {
      /* permission denied / unavailable — silently ignore */
    }
    return () => {
      map.off("locationfound", onLocated);
      map.off("locationerror", onLocateError);
    };
  }, [map, commandRef, externalRef]);
  return null;
}

function MapTools({ commandRef }: { commandRef: React.MutableRefObject<MapCommand | null> }) {
  const [locating, setLocating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div className="absolute bottom-4 right-3 z-[500] flex flex-col gap-1.5">
      <div className="flex flex-col gap-1.5 rounded-2xl border border-border/50 bg-background/90 p-1.5 shadow-lg backdrop-blur">
        <ToolButton label="Zoom in" icon={<Plus className="size-4" />} onClick={() => commandRef.current?.zoomIn()} />
        <ToolButton label="Zoom out" icon={<Minus className="size-4" />} onClick={() => commandRef.current?.zoomOut()} />
      </div>
      <div className="flex flex-col gap-1.5 rounded-2xl border border-border/50 bg-background/90 p-1.5 shadow-lg backdrop-blur">
        <ToolButton
          label="My location"
          icon={locating ? <Compass className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          onClick={() => {
            setLocating(true);
            commandRef.current?.locate();
            setTimeout(() => setLocating(false), 1500);
          }}
        />
        <ToolButton
          label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          icon={fullscreen ? <Maximize2 className="size-4" /> : <Expand className="size-4" />}
          onClick={() => commandRef.current?.fullscreen()}
        />
        <ToolButton label="Reset to Egypt" icon={<Crosshair className="size-4" />} onClick={() => commandRef.current?.resetView()} />
      </div>
    </div>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-xl transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}

function MapSearch({ commandRef }: { commandRef: React.MutableRefObject<MapCommand | null> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const coords = parseCoordinateQuery(trimmed);
    if (coords) {
      setResults([
        {
          lat: coords.lat,
          lng: coords.lng,
          label: `Coordinates · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        },
      ]);
      setOpen(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    runSearch(v);
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    if (parseCoordinateQuery(q)) return;
    const timer = setTimeout(async () => {
      try {
        const r = await geocodeAddress(q);
        setResults(r);
        setOpen(true);
        setLoading(false);
      } catch {
        setResults([]);
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, []);

  const fly = (r: GeocodeResult) => {
    commandRef.current?.flyTo({ lat: r.lat, lng: r.lng }, 13);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="absolute left-1/2 top-3 z-[600] w-[min(92%,30rem)] -translate-x-1/2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={onInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) fly(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search place name or coordinates (lat, lng)…"
          className="h-11 w-full rounded-2xl border border-border/60 bg-background/95 pl-9 pr-16 text-sm shadow-lg backdrop-blur outline-none ring-ring/30 transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      {open && results.length > 0 && (
        <div className="mt-1.5 overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur">
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((r, i) => (
              <li key={`${r.label}-${i}`}>
                <button
                  type="button"
                  onClick={() => fly(r)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Navigation className="size-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2 flex-1">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
            <span>Powered by OpenStreetMap Nominatim</span>
            <kbd className="rounded border border-border/60 bg-background px-1">↵ to select</kbd>
          </div>
        </div>
      )}
    </div>
  );
}

function BasemapSwitcher({ basemap, onChange }: { basemap: BasemapId; onChange: (id: BasemapId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = basemapById(basemap);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, []);

  const streets = BASEMAPS.filter((b) => b.kind === "street");
  const satellites = BASEMAPS.filter((b) => b.kind === "satellite");

  return (
    <div ref={ref} className="absolute bottom-4 left-3 z-[600]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/90 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-background"
      >
        <span className="size-4 rounded-[6px] border border-border/60" style={{ background: current.swatch }} />
        <span className="hidden sm:inline">{current.label}</span>
        <Layers className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="mt-1.5 w-56 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur animate-in fade-in-0 zoom-in-95">
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Streets</p>
          <div className="grid grid-cols-3 gap-1.5">
            {streets.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange(b.id)}
                title={b.label}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors",
                  basemap === b.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                )}
              >
                <span className="h-9 w-full rounded-lg border border-border/60" style={{ background: b.swatch }} />
                <span className={cn("text-[10px] font-medium", basemap === b.id ? "text-primary" : "text-muted-foreground")}>
                  {b.short}
                </span>
              </button>
            ))}
          </div>
          <p className="px-2 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Satellite</p>
          <div className="grid grid-cols-3 gap-1.5">
            {satellites.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange(b.id)}
                title={b.label}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors",
                  basemap === b.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                )}
              >
                <span className="h-9 w-full rounded-lg border border-border/60" style={{ background: b.swatch }} />
                <span className={cn("text-[10px] font-medium", basemap === b.id ? "text-primary" : "text-muted-foreground")}>
                  {b.short}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedBounds({
  locations,
  selectedId,
}: {
  locations: GeoLocation[];
  selectedId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (loc) map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 12), { duration: 0.8 });
  }, [selectedId, locations, map]);
  return null;
}

function DrawBanner({ drawMode }: { drawMode: MapDrawMode }) {
  if (!drawMode) return null;
  const meta =
    drawMode === "point"
      ? { label: "Click anywhere on the map to place the location", icon: <MousePointer2 className="size-4" />, cls: "bg-primary/95 text-primary-foreground" }
      : drawMode === "zone"
        ? { label: "Draw a polygon to define the restricted zone (Esc to cancel)", icon: <ShieldAlert className="size-4" />, cls: "bg-amber-500/95 text-white" }
        : drawMode === "boundary"
          ? { label: "Draw the boundary polygon on the map (Esc to cancel)", icon: <MapIcon className="size-4" />, cls: "bg-indigo-500/95 text-white" }
          : drawMode === "multipolygon"
            ? { label: "Draw each polygon, then press Done to finish", icon: <MapIcon className="size-4" />, cls: "bg-teal-600/95 text-white" }
            : { label: `Draw a ${drawMode} on the map (Esc to cancel)`, icon: <MapIcon className="size-4" />, cls: "bg-primary/95 text-primary-foreground" };
  return (
    <div className={cn("pointer-events-none absolute bottom-4 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold shadow-lg", meta.cls)}>
      {meta.icon}
      {meta.label}
    </div>
  );
}

export function GeoContextMap({
  locations,
  zones,
  boundaries,
  visibleLayers,
  selectedLocationId,
  selectedZoneId,
  selectedBoundaryId,
  drawMode,
  editMode,
  editZonesMode,
  basemap: basemapProp,
  onBasemapChange,
  heatPoints,
  onSelectLocation,
  onSelectZone,
  onSelectBoundary,
  onGeometryDrawn,
  onMultiPartDrawn,
  onDraftGeometryChange,
  onZonePolygonEdited,
  onLocationContextMenu,
  onZoneContextMenu,
  commandRef: externalCommandRef,
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

  const isControlled = basemapProp !== undefined;
  const [internalBasemap, setInternalBasemap] = useState<BasemapId>(basemapProp ?? DEFAULT_BASEMAP);
  const basemap = isControlled ? basemapProp : internalBasemap;
  const changeBasemap = (id: BasemapId) => {
    if (onBasemapChange) onBasemapChange(id);
    else setInternalBasemap(id);
  };
  const commandRef = useRef<MapCommand | null>(null);

  // Points render as clustered markers; polygon locations render as polygons.
  const pointLocations = useMemo(
    () => locations.filter((l) => !(l.polygon && l.polygon.length >= 3) && markerCategories.has(l.category)),
    [locations, markerCategories]
  );
  const polygonLocations = useMemo(
    () => locations.filter((l) => l.polygon && l.polygon.length >= 3 && markerCategories.has(l.category)),
    [locations, markerCategories]
  );
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
  const visibleBoundaries = visibleLayers.boundaries ? boundaries : [];
  const aiLocations = visibleLayers.ai_recommendations ? locations.filter((l) => l.safetyScore < 75) : [];

  // Snap points derived from visible locations (enables "snap to existing geometry").
  const snapPoints = useMemo(() => {
    if (!editMode && !drawMode) return [];
    return locations
      .filter((l) => markerCategories.has(l.category))
      .map((l) => ({ lat: l.lat, lng: l.lng }))
      .slice(0, 500);
  }, [locations, markerCategories, editMode, drawMode]);

  return (
    <div className={cn("relative h-full min-h-[420px] overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={EGYPT_MIN_ZOOM}
        maxZoom={EGYPT_MAX_ZOOM}
        maxBounds={EGYPT_BBOX}
        maxBoundsViscosity={0.85}
        scrollWheelZoom
        zoomSnap={0.5}
        zoomDelta={0.5}
        zoomAnimation
        fadeAnimation
        markerZoomAnimation
        zoomControl
        attributionControl
        className="h-full w-full"
        style={{ background: "#1f364d", minHeight: 420 }}
      >
        <BaseLayers basemap={basemapById(basemap)} />
        <MapCommandProvider commandRef={commandRef} externalRef={externalCommandRef} />
        <DrawingController
          drawMode={drawMode}
          editMode={!!editMode}
          snapPoints={snapPoints}
          onGeometryDrawn={onGeometryDrawn}
          onMultiPartDrawn={onMultiPartDrawn}
          onDraftGeometryChange={onDraftGeometryChange}
          commandRef={commandRef}
        />
        <EditZonesController zones={visibleZones} active={editZonesMode ?? false} onEdited={onZonePolygonEdited ?? (() => undefined)} />

        {visibleBoundaries.map((b) => (
          <Polygon
            key={`b-${b.id}`}
            positions={b.polygon.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: selectedBoundaryId === b.id ? "#6366f1" : "#818cf8",
              weight: selectedBoundaryId === b.id ? 3 : 2,
              fillColor: "#6366f1",
              fillOpacity: 0.05,
              dashArray: "6 4",
            }}
            eventHandlers={{ click: () => onSelectBoundary?.(b.id) }}
          >
            <Popup>{b.name}</Popup>
          </Polygon>
        ))}

        {visibleZones.map((zone) => {
          const isMilitary = zone.restrictionType === "military";
          const color = isMilitary ? "#dc2626" : zone.riskLevel === "extreme" ? "#7f1d1d" : "#f59e0b";
          const selected = selectedZoneId === zone.id;
          return (
            <Polygon
              key={`z-${zone.id}`}
              positions={zone.polygon.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: selected ? "#0b6f6b" : color,
                weight: selected ? 4 : 2.5,
                fillColor: color,
                fillOpacity: selected ? 0.22 : 0.12,
                dashArray: isMilitary ? "8 6" : undefined,
              }}
              eventHandlers={{
                click: () => onSelectZone?.(zone.id),
                contextmenu: (e) => {
                  if (onZoneContextMenu) {
                    const oe = e.originalEvent as MouseEvent;
                    onZoneContextMenu(zone, { x: oe.clientX, y: oe.clientY });
                  }
                },
              }}
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

        {/* Area-based locations rendered as polygons */}
        {polygonLocations.map((location) => {
          const meta = categoryMeta(location.category);
          const selected = selectedLocationId === location.id;
          return (
            <Polygon
              key={`pl-${location.id}`}
              positions={location.polygon!.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: selected ? "#0b6f6b" : meta.color,
                weight: selected ? 4 : 2,
                fillColor: meta.color,
                fillOpacity: selected ? 0.3 : 0.15,
              }}
              eventHandlers={{
                click: () => onSelectLocation(location.id),
                contextmenu: (e) => {
                  if (onLocationContextMenu) {
                    const oe = e.originalEvent as MouseEvent;
                    onLocationContextMenu(location, { x: oe.clientX, y: oe.clientY });
                  }
                },
              }}
            >
              <Popup>{location.nameEn}</Popup>
            </Polygon>
          );
        })}

        {visibleLayers.weather_layer && <WeatherLayer />}

        {visibleLayers.ai_recommendations &&
          aiLocations.map((l) => (
            <Marker
              key={`ai-${l.id}`}
              position={[l.lat, l.lng]}
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

        {pointLocations.length > 0 && (
          <MarkerClusterGroup chunkedLoading polygonOptions={{ color: "#0b6f6b" }} showCoverageOnHover={false}>
            {pointLocations.map((location) => (
              <LocationMarker
                key={location.id}
                location={location}
                selected={location.id === selectedLocationId}
                visibleWarnings={visibleLayers.warnings}
                onClick={onSelectLocation}
                onContextMenu={onLocationContextMenu}
              />
            ))}
          </MarkerClusterGroup>
        )}

        <SelectedBounds locations={locations} selectedId={selectedLocationId} />
      </MapContainer>

      <MapSearch commandRef={commandRef} />
      <MapTools commandRef={commandRef} />
      <BasemapSwitcher basemap={basemap} onChange={changeBasemap} />
      <DrawBanner drawMode={drawMode} />
    </div>
  );
}
