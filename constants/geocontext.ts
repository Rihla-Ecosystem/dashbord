import type {
  LocationCategory,
  NearbyServiceType,
  RestrictionType,
  RiskLevel,
  WarningCategory,
  WarningSeverity,
} from "@/types/geocontext";

export const DEFAULT_MAP_CENTER = { lat: 26.820553, lng: 30.802498 };
export const DEFAULT_MAP_ZOOM = 6;
export const EGYPT_MIN_ZOOM = 5;
export const EGYPT_MAX_ZOOM = 19;
export const EGYPT_BBOX: [[number, number], [number, number]] = [
  [21.9, 24.7],
  [31.7, 35.6],
];

export interface WeatherCity {
  name: string;
  lat: number;
  lng: number;
}

export const EGYPT_WEATHER_CITIES: WeatherCity[] = [
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Alexandria", lat: 31.2001, lng: 29.9187 },
  { name: "Giza", lat: 30.015, lng: 31.1417 },
  { name: "Luxor", lat: 25.6872, lng: 32.6396 },
  { name: "Aswan", lat: 24.0889, lng: 32.8998 },
  { name: "Hurghada", lat: 27.2579, lng: 33.8116 },
  { name: "Sharm El-Sheikh", lat: 27.9158, lng: 34.33 },
  { name: "Marsa Matruh", lat: 27.7326, lng: 26.2375 },
  { name: "Tanta", lat: 31.4692, lng: 30.7787 },
  { name: "Mansoura", lat: 31.0367, lng: 31.3525 },
];

export interface CategoryOption {
  value: LocationCategory;
  label: string;
  color: string;
}

export const LOCATION_CATEGORIES: CategoryOption[] = [
  { value: "attraction", label: "Tourist Attraction", color: "#0ea5e9" },
  { value: "historical", label: "Historical Site", color: "#8b5cf6" },
  { value: "museum", label: "Museum", color: "#6366f1" },
  { value: "restricted", label: "Restricted Area", color: "#ef4444" },
  { value: "hotel", label: "Hotel", color: "#f59e0b" },
  { value: "restaurant", label: "Restaurant", color: "#f97316" },
  { value: "hospital", label: "Hospital", color: "#10b981" },
  { value: "police", label: "Police Station", color: "#3b82f6" },
  { value: "pharmacy", label: "Pharmacy", color: "#14b8a6" },
  { value: "transportation", label: "Transportation", color: "#64748b" },
  { value: "atm", label: "ATM", color: "#22c55e" },
  { value: "embassy", label: "Embassy", color: "#a855f7" },
  { value: "mosque", label: "Mosque", color: "#84cc16" },
  { value: "park", label: "Park", color: "#2dd4bf" },
  { value: "beach", label: "Beach", color: "#38bdf8" },
  { value: "shopping", label: "Shopping", color: "#e879f9" },
  { value: "other", label: "Other", color: "#94a3b8" },
];

export function categoryMeta(category?: LocationCategory | ""): CategoryOption {
  return (
    LOCATION_CATEGORIES.find((c) => c.value === category) ??
    LOCATION_CATEGORIES[LOCATION_CATEGORIES.length - 1]
  );
}

export const CATEGORY_LABELS: Record<LocationCategory, string> = Object.fromEntries(
  LOCATION_CATEGORIES.map((c) => [c.value, c.label])
) as Record<LocationCategory, string>;

export const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Aswan",
  "Luxor",
  "Qena",
  "Red Sea",
  "South Sinai",
  "North Sinai",
  "Suez",
  "Ismailia",
  "Port Said",
  "Fayoum",
  "Minya",
  "Beni Suef",
  "Sohag",
  "Asyut",
  "New Valley",
  "Damietta",
  "Dakahlia",
  "Sharkia",
  "Gharbia",
  "Menoufia",
  "Qalyubia",
  "Kafr El-Sheikh",
  "Beheira",
  "Matrouh",
  "Other",
];

export const EGYPT_CITIES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Aswan",
  "Luxor",
  "Hurghada",
  "Sharm El-Sheikh",
  "Dahab",
  "Marsa Alam",
  "Suez",
  "Port Said",
  "Ismailia",
  "Fayoum",
  "Minya",
  "Abu Simbel",
  "Siwa",
  "El Alamein",
  "Taba",
  "Nuweiba",
  "Safaga",
  "Quseir",
  "Edfu",
  "Kom Ombo",
  "Esna",
  "Dendera",
  "Sohag",
  "Asyut",
];

export const WARNING_CATEGORIES: { value: WarningCategory; label: string }[] = [
  { value: "photography_restriction", label: "Photography Restricted" },
  { value: "military_area", label: "Military Area" },
  { value: "high_crime", label: "High Crime" },
  { value: "flood_risk", label: "Flood Risk" },
  { value: "construction", label: "Construction" },
  { value: "dangerous_animals", label: "Dangerous Animals" },
  { value: "unsafe_roads", label: "Unsafe Roads" },
  { value: "weather_hazard", label: "Weather Hazard" },
  { value: "road_closure", label: "Road Closure" },
  { value: "health_risk", label: "Health Risk" },
  { value: "custom", label: "Custom" },
];

export const WARNING_SEVERITIES: { value: WarningSeverity; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "#dc2626" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "info", label: "Info", color: "#3b82f6" },
];

export function severityMeta(severity: WarningSeverity) {
  return WARNING_SEVERITIES.find((s) => s.value === severity) ?? WARNING_SEVERITIES[2];
}

export const RESTRICTION_TYPES: { value: RestrictionType; label: string }[] = [
  { value: "no_photography", label: "No Photography" },
  { value: "no_drones", label: "No Drones" },
  { value: "military", label: "Military Zone" },
  { value: "government", label: "Government Building" },
  { value: "religious", label: "Religious Site" },
  { value: "environmental", label: "Environmental Protection" },
  { value: "security", label: "Security Zone" },
  { value: "custom", label: "Custom" },
];

export const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
  { value: "extreme", label: "Extreme", color: "#7f1d1d" },
  { value: "high", label: "High", color: "#dc2626" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#22c55e" },
];

export function riskMeta(level: RiskLevel) {
  return RISK_LEVELS.find((r) => r.value === level) ?? RISK_LEVELS[2];
}

export const NEARBY_SERVICE_TYPES: { value: NearbyServiceType; label: string; color: string }[] = [
  { value: "tourist_attraction", label: "Attraction", color: "#0ea5e9" },
  { value: "hotel", label: "Hotel", color: "#f59e0b" },
  { value: "restaurant", label: "Restaurant", color: "#f97316" },
  { value: "hospital", label: "Hospital", color: "#10b981" },
  { value: "police_station", label: "Police Station", color: "#3b82f6" },
  { value: "pharmacy", label: "Pharmacy", color: "#14b8a6" },
  { value: "gas_station", label: "Gas Station", color: "#64748b" },
  { value: "atm", label: "ATM", color: "#22c55e" },
  { value: "metro", label: "Metro Station", color: "#8b5cf6" },
  { value: "bus_stop", label: "Bus Stop", color: "#eab308" },
  { value: "airport", label: "Airport", color: "#6366f1" },
  { value: "embassy", label: "Embassy", color: "#a855f7" },
  { value: "parking", label: "Parking", color: "#94a3b8" },
];

export function nearbyServiceMeta(type: NearbyServiceType) {
  return NEARBY_SERVICE_TYPES.find((s) => s.value === type) ?? NEARBY_SERVICE_TYPES[0];
}

export interface MapLayerDef {
  id: string;
  label: string;
  kind: "markers" | "geo" | "overlay";
  categories?: LocationCategory[];
  visible: boolean;
}

export const MAP_LAYERS: MapLayerDef[] = [
  { id: "tourist_attractions", label: "Tourist Attractions", kind: "markers", categories: ["attraction", "historical", "museum"], visible: true },
  { id: "restricted_areas", label: "Restricted Areas", kind: "geo", visible: true },
  { id: "photography_restricted", label: "Photography Restricted", kind: "markers", categories: ["restricted"], visible: false },
  { id: "military_zones", label: "Military Zones", kind: "geo", visible: false },
  { id: "warnings", label: "Warnings", kind: "overlay", visible: true },
  { id: "hotels", label: "Hotels", kind: "markers", categories: ["hotel"], visible: false },
  { id: "restaurants", label: "Restaurants", kind: "markers", categories: ["restaurant"], visible: false },
  { id: "hospitals", label: "Hospitals", kind: "markers", categories: ["hospital"], visible: false },
  { id: "police_stations", label: "Police Stations", kind: "markers", categories: ["police"], visible: false },
  { id: "pharmacies", label: "Pharmacies", kind: "markers", categories: ["pharmacy"], visible: false },
  { id: "transportation", label: "Transportation", kind: "markers", categories: ["transportation"], visible: false },
  { id: "atms", label: "ATMs", kind: "markers", categories: ["atm"], visible: false },
  { id: "embassies", label: "Embassies", kind: "markers", categories: ["embassy"], visible: false },
  { id: "boundaries", label: "Governorate Boundaries", kind: "geo", visible: true },
  { id: "weather_layer", label: "Weather", kind: "overlay", visible: false },
  { id: "traffic_layer", label: "Traffic", kind: "overlay", visible: false },
  { id: "ai_recommendations", label: "AI Recommendations", kind: "overlay", visible: false },
  { id: "risk_heatmap", label: "Risk Heatmap", kind: "overlay", visible: false },
];

/**
 * Production-grade basemaps.
 *
 * Adapted at runtime to use a MapTiler access token when `NEXT_PUBLIC_MAPTILER_KEY`
 * is configured (256-tile raster styles that expose buildings, roads, landmarks and
 * points of interest). Otherwise it falls back to fully keyless, production-ready
 * Esri ArcGIS tile layers (World Street Map / World Imagery) and CARTO vector-style
 * raster basemaps, all of which render labelled buildings and landmarks at high zoom.
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

const MAPTILER_STREETS = "https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=";
const MAPTILER_SATELLITE = "https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.png?key=";
const MAPTILER_HYBRID = "https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.png?key=";
const MAPTILER_LIGHT = "https://api.maptiler.com/maps/streets-light/256/{z}/{x}/{y}.png?key=";
const MAPTILER_DARK = "https://api.maptiler.com/maps/darkmatter-dark/256/{z}/{x}/{y}.png?key=";

const ESRI_STREET = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const ESRI_IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export const TILE_URLS = {
  light: MAPTILER_KEY ? `${MAPTILER_LIGHT}${MAPTILER_KEY}` : CARTO_LIGHT,
  detailed: MAPTILER_KEY ? `${MAPTILER_STREETS}${MAPTILER_KEY}` : ESRI_STREET,
  dark: MAPTILER_KEY ? `${MAPTILER_DARK}${MAPTILER_KEY}` : CARTO_DARK,
  satellite: MAPTILER_KEY ? `${MAPTILER_SATELLITE}${MAPTILER_KEY}` : ESRI_IMAGERY,
  osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmHOT: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  topo: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
};

export type BasemapId = "street" | "light" | "dark" | "satellite" | "hybrid" | "osm";

export interface BasemapDef {
  id: BasemapId;
  label: string;
  short: string;
  kind: "street" | "satellite";
  url: string;
  /** Optional transparent overlay tiles rendered above the base (e.g. labels). */
  overlays?: string[];
  /** Solid accent colour used for the switcher thumbnail swatch. */
  swatch: string;
}

/**
 * Order matters: the first "street" entry is the default basemap. MapTiler styles
 * are preferred when a token is present, otherwise Esri / CARTO.
 */
export const BASEMAPS: BasemapDef[] = [
  {
    id: "street",
    label: "Streets",
    short: "Street",
    kind: "street",
    url: MAPTILER_KEY ? `${MAPTILER_STREETS}${MAPTILER_KEY}` : ESRI_STREET,
    swatch: "linear-gradient(135deg,#aad3df,#e8edf0 45%,#f7c873 46%,#f3e3c3)",
  },
  {
    id: "light",
    label: "Light",
    short: "Light",
    kind: "street",
    url: MAPTILER_KEY ? `${MAPTILER_LIGHT}${MAPTILER_KEY}` : CARTO_LIGHT,
    swatch: "linear-gradient(135deg,#dce6ec,#f4f5f3 45%,#e9c78c 48%,#f6f1e4)",
  },
  {
    id: "dark",
    label: "Dark",
    short: "Dark",
    kind: "street",
    url: MAPTILER_KEY ? `${MAPTILER_DARK}${MAPTILER_KEY}` : CARTO_DARK,
    swatch: "linear-gradient(135deg,#1c2328,#2b343b 50%,#3a4650)",
  },
  {
    id: "satellite",
    label: "Satellite",
    short: "Sat",
    kind: "satellite",
    url: MAPTILER_KEY ? `${MAPTILER_SATELLITE}${MAPTILER_KEY}` : ESRI_IMAGERY,
    swatch: "linear-gradient(135deg,#0f2414,#2b5a2f 45%,#3f6b58 55%,#0c1c12)",
  },
  {
    id: "hybrid",
    label: "Satellite + Labels",
    short: "Labels",
    kind: "satellite",
    url: MAPTILER_KEY ? `${MAPTILER_HYBRID}${MAPTILER_KEY}` : ESRI_IMAGERY,
    overlays: [ESRI_LABELS],
    swatch: "linear-gradient(135deg,#0f2414,#2b5a2f 45%,#3f6b58 60%,#e9c78c 70%,#0c1c12)",
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    short: "OSM",
    kind: "street",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    swatch: "linear-gradient(135deg,#dcebf4,#f2efe9 45%,#f2d0a4 50%,#dff3e0)",
  },
];

export function basemapById(id: BasemapId | string): BasemapDef {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0];
}

/** Default basemap. Overridable per-user via workspace settings. */
export const DEFAULT_BASEMAP: BasemapId = "street";

/** Quick-focus shortcuts for the map (European-style lat/lng alias keys). */
export const EGYPT_QUICK_CENTERS = {
  egypt: { lat: 26.820553, lng: 30.802498, zoom: 6 },
  cairo: { lat: 30.0444, lng: 31.2357, zoom: 12 },
  alexandria: { lat: 31.2001, lng: 29.9187, zoom: 12 },
  luxor: { lat: 25.6872, lng: 32.6396, zoom: 12 },
  aswan: { lat: 24.0889, lng: 32.8998, zoom: 12 },
  hurghada: { lat: 27.2579, lng: 33.8116, zoom: 12 },
  sharm: { lat: 27.9158, lng: 34.33, zoom: 12 },
} as const;

export const GEO_STATUS_META: Record<
  "published" | "draft" | "unpublished",
  { label: string; color: string }
> = {
  published: { label: "Published", color: "#16a34a" },
  draft: { label: "Draft", color: "#ca8a04" },
  unpublished: { label: "Unpublished", color: "#64748b" },
};

export const RECENT_WINDOWS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const GEO_QUERY_KEYS = {
  locations: ["geocontext", "locations"] as const,
  location: (id: string) => ["geocontext", "location", id] as const,
  warnings: ["geocontext", "warnings"] as const,
  restrictedZones: ["geocontext", "restricted-zones"] as const,
  boundaries: ["geocontext", "boundaries"] as const,
  analytics: ["geocontext", "analytics"] as const,
  nearby: (id: string) => ["geocontext", "nearby", id] as const,
  activity: ["geocontext", "activity"] as const,
  governorates: ["geocontext", "governorates"] as const,
  weather: (lat: number, lng: number) => ["geocontext", "weather", lat, lng] as const,
  safety: (id: string) => ["geocontext", "safety", id] as const,
};
