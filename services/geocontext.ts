import { axiosInstance } from "./axios";
import { buildQueryString } from "@/utils";
import {
  buildMockActivity,
  buildMockAnalytics,
  buildMockBoundaries,
  buildMockLocations,
  buildMockZones,
  createMockLocation,
} from "@/features/geocontext/mock-data";
import type {
  ActivityEvent,
  Boundary,
  GeoAnalytics,
  GeoFilters,
  GeoJSONFeatureCollection,
  GeoLocation,
  GeoSort,
  LocationInput,
  LocationWarning,
  NearbyService,
  NearbyServiceInput,
  RestrictedZone,
} from "@/types/geocontext";

/**
 * GeoContext integration layer.
 *
 * The GeoContext service exposes its own REST API (GET /api/v1/context,
 * GET|POST /api/v1/location, GET|POST /api/v1/restricted-zones, ...).
 * The dashboard reaches those through the Core-Server gateway, so we target
 * the /geocontext/... gateway paths here. When the gateway (or the GeoContext
 * backend) is not available yet, every call transparently falls back to a
 * deterministic in-memory mock so the CMS is fully usable today.
 */

let mockMode: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

async function detectMockMode(): Promise<boolean> {
  if (mockMode !== null) return mockMode;
  if (!probePromise) {
    probePromise = (async () => {
      try {
        await axiosInstance.get("/geocontext/context", { timeout: 3000 });
        mockMode = false;
      } catch {
        mockMode = true;
      }
      return mockMode;
    })();
  }
  return probePromise;
}

interface MockStore {
  locations: GeoLocation[];
  zones: RestrictedZone[];
  boundaries: Boundary[];
  activity: ActivityEvent[];
}

let store: MockStore | null = null;

function getStore(): MockStore {
  if (!store) {
    store = {
      locations: buildMockLocations(),
      zones: buildMockZones(),
      boundaries: buildMockBoundaries(),
      activity: buildMockActivity(),
    };
  }
  return store;
}

function now(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function unwrapEnvelope<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    const record = envelope as Record<string, unknown>;
    if (record.success && "data" in record) return record.data as T;
  }
  return envelope as T;
}

function pushActivity(type: ActivityEvent["type"], action: string, targetName: string, targetId?: string) {
  getStore().activity.unshift({
    id: uid("act"),
    type,
    action,
    actor: "You",
    targetId,
    targetName,
    createdAt: now(),
  });
}

export interface LocationQuery {
  page?: number;
  limit?: number;
  filters?: Partial<GeoFilters>;
  sort?: GeoSort;
}

export interface PaginatedLocations {
  data: GeoLocation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const geocontextApi = {
  async getLocations(query?: LocationQuery): Promise<PaginatedLocations> {
    if (await detectMockMode()) {
      const page = query?.page ?? 1;
      const limit = query?.limit ?? 10;
      const filters = query?.filters ?? {};
      const sort = query?.sort;
      let items = [...getStore().locations];

      const q = (filters.search ?? "").trim().toLowerCase();
      if (q) {
        items = items.filter(
          (l) =>
            l.nameEn.toLowerCase().includes(q) ||
            l.nameAr.includes(filters.search ?? "") ||
            l.city.toLowerCase().includes(q) ||
            l.governorate.toLowerCase().includes(q) ||
            l.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (filters.category) items = items.filter((l) => l.category === filters.category);
      if (filters.governorate) items = items.filter((l) => l.governorate === filters.governorate);
      if (filters.status) items = items.filter((l) => l.status === filters.status);
      if (filters.risk) items = items.filter((l) => l.riskLevel === filters.risk);
      if (filters.hasWarnings !== undefined && filters.hasWarnings !== "") {
        items = items.filter((l) => (l.warnings.some((w) => w.active) === filters.hasWarnings));
      }
      if (filters.updatedSince) {
        const hours = Number(filters.updatedSince);
        const cutoff = Date.now() - hours * 3600_000;
        items = items.filter((l) => new Date(l.updatedAt).getTime() >= cutoff);
      }

      if (sort) {
        const dir = sort.order === "asc" ? 1 : -1;
        items.sort((a, b) => {
          if (sort.field === "nameEn") return a.nameEn.localeCompare(b.nameEn) * dir;
          if (sort.field === "safetyScore") return (a.safetyScore - b.safetyScore) * dir;
          if (sort.field === "category") return a.category.localeCompare(b.category) * dir;
          return (a.updatedAt < b.updatedAt ? -1 : 1) * dir;
        });
      } else {
        items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      }

      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const data = items.slice((page - 1) * limit, page * limit);
      return { data, total, page, limit, totalPages };
    }

    const params = {
      page: query?.page,
      limit: query?.limit,
      search: query?.filters?.search,
      category: query?.filters?.category,
      governorate: query?.filters?.governorate,
      status: query?.filters?.status,
      risk: query?.filters?.risk,
      sortBy: query?.sort?.field,
      sortOrder: query?.sort?.order,
    };
    const { data } = await axiosInstance.get<unknown>(`/geocontext/location${buildQueryString(params)}`);
    return unwrapEnvelope<PaginatedLocations>(data);
  },

  async getLocation(id: string): Promise<GeoLocation> {
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === id);
      if (!loc) throw new Error("Location not found");
      return loc;
    }
    const { data } = await axiosInstance.get<unknown>(`/geocontext/location/${id}`);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async createLocation(input: LocationInput): Promise<GeoLocation> {
    if (await detectMockMode()) {
      const loc = createMockLocation(input);
      getStore().locations.unshift(loc);
      pushActivity("location", "location.created", loc.nameEn, loc.id);
      return loc;
    }
    const { data } = await axiosInstance.post<unknown>("/geocontext/location", input);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async updateLocation(id: string, input: Partial<LocationInput>): Promise<GeoLocation> {
    if (await detectMockMode()) {
      const storeData = getStore();
      const loc = storeData.locations.find((l) => l.id === id);
      if (!loc) throw new Error("Location not found");
      const merged: GeoLocation = { ...loc, ...input, id };
      merged.version += 1;
      merged.updatedAt = now();
      merged.versions = [
        { version: merged.version, changedBy: "You", createdAt: now(), changes: ["Profile updated"] },
        ...loc.versions,
      ];
      merged.auditLog = [
        { id: uid("audit"), action: "location.updated", actor: "You", createdAt: now() },
        ...loc.auditLog,
      ];
      const index = storeData.locations.findIndex((l) => l.id === id);
      storeData.locations[index] = merged;
      pushActivity("location", "location.updated", merged.nameEn, id);
      return merged;
    }
    const { data } = await axiosInstance.put<unknown>(`/geocontext/location/${id}`, input);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async deleteLocation(id: string): Promise<{ id: string }> {
    if (await detectMockMode()) {
      const storeData = getStore();
      const loc = storeData.locations.find((l) => l.id === id);
      storeData.locations = storeData.locations.filter((l) => l.id !== id);
      if (loc) pushActivity("location", "location.deleted", loc.nameEn, id);
      return { id };
    }
    await axiosInstance.delete(`/geocontext/location/${id}`);
    return { id };
  },

  async setLocationStatus(id: string, status: GeoLocation["status"]): Promise<GeoLocation> {
    if (await detectMockMode()) {
      const storeData = getStore();
      const loc = storeData.locations.find((l) => l.id === id);
      if (!loc) throw new Error("Location not found");
      loc.status = status;
      loc.updatedAt = now();
      loc.publishedAt = status === "published" ? now() : loc.publishedAt;
      loc.auditLog = [
        { id: uid("audit"), action: `location.${status}`, actor: "You", createdAt: now() },
        ...loc.auditLog,
      ];
      pushActivity("location", `location.${status}`, loc.nameEn, id);
      return loc;
    }
    const { data } = await axiosInstance.put<unknown>(`/geocontext/location/${id}/status`, { status });
    return unwrapEnvelope<GeoLocation>(data);
  },

  async addWarning(locationId: string, warning: Omit<LocationWarning, "id" | "createdAt">): Promise<LocationWarning> {
    const created: LocationWarning = {
      ...warning,
      id: uid("warn"),
      createdAt: now(),
    };
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === locationId);
      if (!loc) throw new Error("Location not found");
      loc.warnings = [created, ...loc.warnings];
      loc.updatedAt = now();
      pushActivity("warning", "warning.created", `${loc.nameEn} — ${created.title}`, locationId);
      return created;
    }
    const { data } = await axiosInstance.post<unknown>(`/geocontext/location/${locationId}/warnings`, warning);
    return unwrapEnvelope<LocationWarning>(data);
  },

  async deleteWarning(locationId: string, warningId: string): Promise<void> {
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === locationId);
      if (!loc) throw new Error("Location not found");
      loc.warnings = loc.warnings.filter((w) => w.id !== warningId);
      loc.updatedAt = now();
      pushActivity("warning", "warning.deleted", loc.nameEn, locationId);
      return;
    }
    await axiosInstance.delete(`/geocontext/location/${locationId}/warnings/${warningId}`);
  },

  async getRestrictedZones(): Promise<RestrictedZone[]> {
    if (await detectMockMode()) return getStore().zones;
    const { data } = await axiosInstance.get<unknown>("/geocontext/restricted-zones");
    return unwrapEnvelope<RestrictedZone[]>(data);
  },

  async createRestrictedZone(input: Omit<RestrictedZone, "id" | "createdAt" | "updatedAt">): Promise<RestrictedZone> {
    const zone: RestrictedZone = { ...input, id: uid("zone"), createdAt: now(), updatedAt: now() };
    if (await detectMockMode()) {
      getStore().zones.push(zone);
      pushActivity("zone", "zone.created", zone.name, zone.id);
      return zone;
    }
    const { data } = await axiosInstance.post<unknown>("/geocontext/restricted-zones", input);
    return unwrapEnvelope<RestrictedZone>(data);
  },

  async updateRestrictedZone(id: string, input: Partial<RestrictedZone>): Promise<RestrictedZone> {
    if (await detectMockMode()) {
      const storeData = getStore();
      const zone = storeData.zones.find((z) => z.id === id);
      if (!zone) throw new Error("Restricted zone not found");
      const merged = { ...zone, ...input, id, updatedAt: now() };
      storeData.zones[storeData.zones.findIndex((z) => z.id === id)] = merged;
      pushActivity("zone", "zone.updated", merged.name, id);
      return merged;
    }
    const { data } = await axiosInstance.put<unknown>(`/geocontext/restricted-zones/${id}`, input);
    return unwrapEnvelope<RestrictedZone>(data);
  },

  async deleteRestrictedZone(id: string): Promise<void> {
    if (await detectMockMode()) {
      const storeData = getStore();
      const zone = storeData.zones.find((z) => z.id === id);
      storeData.zones = storeData.zones.filter((z) => z.id !== id);
      if (zone) pushActivity("zone", "zone.deleted", zone.name, id);
      return;
    }
    await axiosInstance.delete(`/geocontext/restricted-zones/${id}`);
  },

  async getBoundaries(): Promise<Boundary[]> {
    if (await detectMockMode()) return getStore().boundaries;
    const { data } = await axiosInstance.get<unknown>("/geocontext/boundaries");
    return unwrapEnvelope<Boundary[]>(data);
  },

  async getAnalytics(): Promise<GeoAnalytics> {
    if (await detectMockMode()) {
      const s = getStore();
      return buildMockAnalytics(s.locations, s.zones);
    }
    const { data } = await axiosInstance.get<unknown>("/geocontext/analytics");
    return unwrapEnvelope<GeoAnalytics>(data);
  },

  async getActivity(): Promise<ActivityEvent[]> {
    if (await detectMockMode()) return getStore().activity;
    const { data } = await axiosInstance.get<unknown>("/geocontext/activity");
    return unwrapEnvelope<ActivityEvent[]>(data);
  },

  async importGeoJSON(fc: GeoJSONFeatureCollection): Promise<{ imported: number }> {
    if (await detectMockMode()) {
      let imported = 0;
      for (const feature of fc.features) {
        if (feature.geometry.type !== "Point") continue;
        const coords = feature.geometry.coordinates as [number, number];
        const props = feature.properties as Record<string, unknown>;
        const input: LocationInput = {
          nameAr: String(props.nameAr ?? props.name ?? "Imported location"),
          nameEn: String(props.name ?? props.nameEn ?? "Imported location"),
          description: String(props.description ?? ""),
          category: (props.category as GeoLocation["category"]) ?? "other",
          governorate: String(props.governorate ?? ""),
          city: String(props.city ?? ""),
          country: String(props.country ?? "Egypt"),
          address: String(props.address ?? ""),
          lat: coords[1],
          lng: coords[0],
          tags: [],
          history: "",
          culturalInfo: "",
          touristDescription: "",
          bestTimeToVisit: "",
          accessibility: "",
          photographyRules: "",
          droneRules: "",
          transportationTips: "",
          localTips: "",
          emergencyInstructions: "",
          interestingFacts: [],
          ticket: { currency: "EGP" },
          openingHours: {},
          contact: {},
          visibility: "public",
          customMetadata: {},
        };
        getStore().locations.unshift(createMockLocation(input));
        imported += 1;
      }
      pushActivity("location", "location.import", `${imported} location(s) imported`);
      return { imported };
    }
    const { data } = await axiosInstance.post<unknown>("/geocontext/import/geojson", fc);
    return unwrapEnvelope<{ imported: number }>(data);
  },

  async exportGeoJSON(): Promise<GeoJSONFeatureCollection> {
    if (await detectMockMode()) {
      const features = getStore().locations.map((l) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [l.lng, l.lat] as [number, number] },
        properties: {
          id: l.id,
          name: l.nameEn,
          nameAr: l.nameAr,
          category: l.category,
          governorate: l.governorate,
          city: l.city,
          status: l.status,
          safetyScore: l.safetyScore,
          updatedAt: l.updatedAt,
        },
      }));
      return { type: "FeatureCollection", name: "rihla-geocontext", features };
    }
    const { data } = await axiosInstance.get<unknown>("/geocontext/export/geojson");
    return unwrapEnvelope<GeoJSONFeatureCollection>(data);
  },

  async getNearbyServices(locationId: string): Promise<GeoLocation["nearby"]> {
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === locationId);
      return loc?.nearby ?? [];
    }
    const { data } = await axiosInstance.get<unknown>(`/geocontext/nearby-services${buildQueryString({ locationId })}`);
    return unwrapEnvelope<GeoLocation["nearby"]>(data);
  },

  async addNearbyService(locationId: string, input: NearbyServiceInput): Promise<NearbyService> {
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === locationId);
      if (!loc) throw new Error("Location not found");
      const service: NearbyService = {
        id: `ns-${Date.now()}`,
        locationId,
        name: input.name,
        type: input.type,
        distanceKm: input.distanceKm,
        lat: loc.lat,
        lng: loc.lng,
        rating: input.rating,
        contact: input.contact,
      };
      loc.nearby.push(service);
      pushActivity("location", "location.nearby_service_added", service.name, locationId);
      return service;
    }
    const { data } = await axiosInstance.post<unknown>(`/geocontext/locations/${locationId}/nearby-services`, input);
    return unwrapEnvelope<NearbyService>(data);
  },

  async deleteNearbyService(locationId: string, serviceId: string): Promise<void> {
    if (await detectMockMode()) {
      const loc = getStore().locations.find((l) => l.id === locationId);
      if (!loc) return;
      const service = loc.nearby.find((s) => s.id === serviceId);
      loc.nearby = loc.nearby.filter((s) => s.id !== serviceId);
      if (service) pushActivity("location", "location.nearby_service_removed", service.name, locationId);
      return;
    }
    await axiosInstance.delete(`/geocontext/locations/${locationId}/nearby-services/${serviceId}`);
  },
};
