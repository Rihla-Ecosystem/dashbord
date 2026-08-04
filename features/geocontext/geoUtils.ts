import type { GeoCoordinates, GeoJSONFeatureCollection, GeoLocation } from "@/types/geocontext";

export interface ReverseGeocodeResult {
  address: string;
  governorate?: string;
  city?: string;
  country?: string;
}

function nominatimUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ format: "jsonv2", ...params });
  return `https://nominatim.openstreetmap.org/${path}?${qs.toString()}`;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(nominatimUrl("reverse", { lat: String(lat), lon: String(lng), zoom: "16" }), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("reverse geocode failed");
    const data = (await res.json()) as {
      display_name?: string;
      address?: { state?: string; city?: string; town?: string; village?: string; country?: string };
    };
    return {
      address: data.display_name ?? "",
      governorate: data.address?.state,
      city: data.address?.city ?? data.address?.town ?? data.address?.village,
      country: data.address?.country,
    };
  } catch {
    return { address: "", governorate: "", city: "", country: "" };
  }
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  try {
    const res = await fetch(
      nominatimUrl("search", { q: query, countrycodes: "eg", limit: "8", addressdetails: "1" }),
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error("geocode failed");
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;
    return data.map((d) => ({
      lat: Number(d.lat),
      lng: Number(d.lon),
      label: d.display_name ?? `${d.lat}, ${d.lon}`,
    }));
  } catch {
    return [];
  }
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function formatCoordinate(value: number, digits = 5): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function polygonToCoords(polygon: GeoCoordinates[]): Array<[number, number]> {
  return polygon.map((p) => [p.lat, p.lng]);
}

export function coordsToPolygon(coords: Array<[number, number]>): GeoCoordinates[] {
  return coords.map(([lat, lng]) => ({ lat, lng }));
}

export function haversineKm(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function locationsToFeatureCollection(locations: GeoLocation[]): GeoJSONFeatureCollection {
  return {
    type: "FeatureCollection",
    name: "rihla-geocontext",
    features: locations.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.lng, l.lat] as [number, number] },
      properties: {
        id: l.id,
        name: l.nameEn,
        nameAr: l.nameAr,
        category: l.category,
        governorate: l.governorate,
        city: l.city,
        status: l.status,
        safetyScore: l.safetyScore,
        riskLevel: l.riskLevel,
        updatedAt: l.updatedAt,
      },
    })),
  };
}

export function parseGeoJSONFile(file: File): Promise<GeoJSONFeatureCollection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
          reject(new Error("Invalid GeoJSON: expected a FeatureCollection"));
          return;
        }
        resolve(parsed as GeoJSONFeatureCollection);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.readAsText(file);
  });
}

export function downloadFile(filename: string, content: string, type = "application/json"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function roundToDegrees(lat: number, lng: number, radiusMeters: number): { lat: number; lng: number } {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return { lat: latDelta, lng: lngDelta };
}
