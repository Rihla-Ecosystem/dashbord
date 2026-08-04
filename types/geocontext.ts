import type { UserRole } from "@/types";

export type GeoStatus = "published" | "draft" | "unpublished";

export type GeoVisibility = "public" | "private" | "restricted";

export type LocationCategory =
  | "attraction"
  | "historical"
  | "museum"
  | "restricted"
  | "hotel"
  | "restaurant"
  | "hospital"
  | "police"
  | "pharmacy"
  | "transportation"
  | "atm"
  | "embassy"
  | "mosque"
  | "park"
  | "beach"
  | "shopping"
  | "other";

export type WarningSeverity = "critical" | "high" | "medium" | "low" | "info";

export type WarningCategory =
  | "photography_restriction"
  | "military_area"
  | "high_crime"
  | "flood_risk"
  | "construction"
  | "dangerous_animals"
  | "unsafe_roads"
  | "weather_hazard"
  | "road_closure"
  | "health_risk"
  | "custom";

export type RestrictionType =
  | "no_photography"
  | "no_drones"
  | "military"
  | "government"
  | "religious"
  | "environmental"
  | "security"
  | "custom";

export type RiskLevel = "extreme" | "high" | "medium" | "low";

export type NearbyServiceType =
  | "tourist_attraction"
  | "hotel"
  | "restaurant"
  | "hospital"
  | "police_station"
  | "pharmacy"
  | "gas_station"
  | "atm"
  | "metro"
  | "bus_stop"
  | "airport"
  | "embassy"
  | "parking";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface LocationWarning {
  id: string;
  title: string;
  description: string;
  severity: WarningSeverity;
  category: WarningCategory;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface RestrictedZone {
  id: string;
  name: string;
  description: string;
  restrictionType: RestrictionType;
  riskLevel: RiskLevel;
  allowedActivities: string[];
  forbiddenActivities: string[];
  active: boolean;
  polygon: GeoCoordinates[];
  createdAt: string;
  updatedAt: string;
}

export interface Boundary {
  id: string;
  name: string;
  description?: string;
  type: "governorate" | "city" | "custom";
  polygon: GeoCoordinates[];
  createdAt: string;
}

export interface NearbyService {
  id: string;
  locationId: string;
  name: string;
  type: NearbyServiceType;
  distanceKm: number;
  lat: number;
  lng: number;
  rating?: number;
  contact?: string;
}

export interface NearbyServiceInput {
  name: string;
  type: NearbyServiceType;
  distanceKm: number;
  rating?: number;
  contact?: string;
}

export interface LocationImage {
  id: string;
  url: string;
  caption?: string;
  primary?: boolean;
}

export interface LocationVideo {
  id: string;
  url: string;
  title?: string;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  note?: string;
}

export interface TicketInfo {
  currency: string;
  foreignPrice?: number;
  egyptianPrice?: number;
  free?: boolean;
  note?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorRole?: UserRole;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface VersionEntry {
  version: number;
  changedBy: string;
  createdAt: string;
  changes: string[];
}

export interface SafetyFactor {
  label: string;
  value: "good" | "moderate" | "poor";
  note?: string;
}

export interface SafetyAssessment {
  score: number;
  level: RiskLevel;
  summary: string;
  factors: SafetyFactor[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl?: string;
}

export interface GeoLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  category: LocationCategory;
  governorate: string;
  city: string;
  country: string;
  address: string;
  lat: number;
  lng: number;
  images: LocationImage[];
  videos: LocationVideo[];
  tags: string[];
  history: string;
  culturalInfo: string;
  touristDescription: string;
  bestTimeToVisit: string;
  estimatedDurationMinutes?: number;
  accessibility: string;
  photographyRules: string;
  droneRules: string;
  transportationTips: string;
  localTips: string;
  emergencyInstructions: string;
  interestingFacts: string[];
  unescoStatus?: string;
  ticket: TicketInfo;
  openingHours: OpeningHours;
  contact: ContactInfo;
  warnings: LocationWarning[];
  safetyScore: number;
  riskLevel: RiskLevel;
  aiSummary: string;
  status: GeoStatus;
  visibility: GeoVisibility;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  createdBy: string;
  version: number;
  versions: VersionEntry[];
  auditLog: AuditEntry[];
  relatedLocationIds: string[];
  customMetadata: Record<string, string>;
  nearby: NearbyService[];
}

export type LocationInput = Pick<
  GeoLocation,
  | "nameAr"
  | "nameEn"
  | "description"
  | "category"
  | "governorate"
  | "city"
  | "country"
  | "address"
  | "lat"
  | "lng"
  | "tags"
  | "history"
  | "culturalInfo"
  | "touristDescription"
  | "bestTimeToVisit"
  | "estimatedDurationMinutes"
  | "accessibility"
  | "photographyRules"
  | "droneRules"
  | "transportationTips"
  | "localTips"
  | "emergencyInstructions"
  | "interestingFacts"
  | "unescoStatus"
  | "ticket"
  | "openingHours"
  | "contact"
  | "visibility"
  | "customMetadata"
>;

export interface GeoAnalytics {
  totalLocations: number;
  touristPlaces: number;
  restrictedAreas: number;
  activeWarnings: number;
  governoratesCoverage: number;
  recentlyUpdated: number;
  byCategory: { category: LocationCategory; count: number }[];
  warningsBySeverity: { severity: WarningSeverity; count: number }[];
  topUpdated: { id: string; name: string; updatedAt: string }[];
}

export interface ActivityEvent {
  id: string;
  type: "location" | "warning" | "zone" | "boundary" | "system";
  action: string;
  actor: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface GeoFilters {
  search: string;
  category?: LocationCategory | "";
  governorate?: string | "";
  status?: GeoStatus | "";
  risk?: RiskLevel | "";
  hasWarnings?: boolean | "";
  updatedSince?: string | "";
}

export interface GeoSort {
  field: "updatedAt" | "nameEn" | "safetyScore" | "category";
  order: "asc" | "desc";
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONPoint | GeoJSONPolygon;
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  name?: string;
  features: GeoJSONFeature[];
}
