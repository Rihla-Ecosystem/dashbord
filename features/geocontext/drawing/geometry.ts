import type { GeoCoordinates } from "@/types/geocontext";

/** A single draft shape part drawn on the map (point or polygon ring). */
export interface DraftPart {
  type: "point" | "polygon";
  coords: GeoCoordinates[];
}

/** Geometry being created/edited for a location. */
export interface DraftGeometry {
  parts: DraftPart[];
  centroid: GeoCoordinates;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function ringCentroid(points: GeoCoordinates[]): GeoCoordinates {
  if (!points.length) return { lat: 0, lng: 0 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export function pointGeometry(latlng: GeoCoordinates): DraftGeometry {
  return { parts: [{ type: "point", coords: [latlng] }], centroid: latlng };
}

export function polygonGeometry(ring: GeoCoordinates[]): DraftGeometry {
  const centroid = ringCentroid(ring);
  return { parts: [{ type: "polygon", coords: ring }], centroid };
}

export function multiPolygonGeometry(rings: GeoCoordinates[][]): DraftGeometry {
  const parts: DraftPart[] = rings.map((coords) => ({ type: "polygon", coords }));
  return { parts, centroid: centroidOfParts(parts) };
}

export function centroidOfParts(parts: DraftPart[]): GeoCoordinates {
  if (!parts.length) return { lat: 0, lng: 0 };
  const all = parts.flatMap((p) => p.coords);
  return ringCentroid(all);
}

/** Approximate a circle as a 36-point polygon ring. */
export function circleToRing(center: GeoCoordinates, radiusMeters: number, segments = 36): GeoCoordinates[] {
  const ring: GeoCoordinates[] = [];
  const latFactor = radiusMeters / 111320;
  const lngFactor = radiusMeters / (111320 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    ring.push({
      lat: center.lat + latFactor * Math.cos(angle),
      lng: center.lng + lngFactor * Math.sin(angle),
    });
  }
  return ring;
}

export function boundsToRing(
  southWest: GeoCoordinates,
  northEast: GeoCoordinates
): GeoCoordinates[] {
  return [
    southWest,
    { lat: southWest.lat, lng: northEast.lng },
    northEast,
    { lat: northEast.lat, lng: southWest.lng },
  ];
}

export function extractRing(latlngs: L.LatLng[] | L.LatLng[][]): GeoCoordinates[] {
  const raw = latlngs as unknown;
  const arr = Array.isArray(raw) && Array.isArray((raw as unknown[])[0])
    ? (raw as unknown[])
    : (raw as L.LatLng[]);
  return (arr as L.LatLng[]).map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

/**
 * Nearest snap point to `target` within `thresholdMeters`. Returns the snapped
 * coordinate or null when nothing is close enough.
 */
export function findSnap(
  target: GeoCoordinates,
  snapPoints: GeoCoordinates[],
  thresholdMeters = 25
): GeoCoordinates | null {
  if (!snapPoints.length) return null;
  let best: GeoCoordinates | null = null;
  let bestDist = thresholdMeters;
  for (const p of snapPoints) {
    const d = haversineMeters(target, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function haversineMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Serialize a draft geometry into the customMetadata `polygon` payload string. */
export function geometryToPayload(draft: DraftGeometry | null): string | undefined {
  if (!draft || !draft.parts.length) return undefined;
  const polygons = draft.parts
    .filter((p) => p.type === "polygon" && p.coords.length >= 3)
    .map((p) => p.coords);
  if (polygons.length) return JSON.stringify(polygons);
  const point = draft.parts.find((p) => p.type === "point")?.coords[0];
  if (point) return JSON.stringify([point]);
  return undefined;
}

/** Parse the `polygon` customMetadata payload into a draft geometry. */
export function payloadToGeometry(raw?: string): DraftGeometry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GeoCoordinates[] | GeoCoordinates[][];
    if (!Array.isArray(parsed)) return null;
    const first = parsed[0];
    if (Array.isArray(first)) {
      return multiPolygonGeometry(parsed as GeoCoordinates[][]);
    }
    const coords = parsed as GeoCoordinates[];
    if (coords.length === 1) return pointGeometry(coords[0]);
    return polygonGeometry(coords);
  } catch {
    return null;
  }
}
