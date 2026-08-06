import { axiosInstance } from "./axios";
import { buildQueryString } from "@/utils";
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
  GeoStatus,
} from "@/types/geocontext";

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

function unwrapEnvelope<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    const record = envelope as Record<string, unknown>;
    if (record.success && "data" in record) return record.data as T;
  }
  return envelope as T;
}

export const geocontextApi = {
  async getLocations(query?: LocationQuery): Promise<PaginatedLocations> {
    const params = {
      page: query?.page,
      limit: query?.limit,
      search: query?.filters?.search,
      category: query?.filters?.category,
      governorate: query?.filters?.governorate,
      status: query?.filters?.status,
      risk: query?.filters?.risk,
      hasWarnings: query?.filters?.hasWarnings,
      updatedSince: query?.filters?.updatedSince,
      sortBy: query?.sort?.field,
      sortOrder: query?.sort?.order,
    };
    const { data } = await axiosInstance.get<unknown>(`/geocontext/locations${buildQueryString(params)}`);
    return unwrapEnvelope<PaginatedLocations>(data);
  },

  async getLocation(id: string): Promise<GeoLocation> {
    const { data } = await axiosInstance.get<unknown>(`/geocontext/locations/${id}`);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async createLocation(input: LocationInput): Promise<GeoLocation> {
    const { data } = await axiosInstance.post<unknown>("/geocontext/locations", input);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async updateLocation(id: string, input: Partial<LocationInput>): Promise<GeoLocation> {
    const { data } = await axiosInstance.put<unknown>(`/geocontext/locations/${id}`, input);
    return unwrapEnvelope<GeoLocation>(data);
  },

  async deleteLocation(id: string): Promise<{ id: string }> {
    await axiosInstance.delete(`/geocontext/locations/${id}`);
    return { id };
  },

  async setLocationStatus(id: string, status: GeoStatus): Promise<GeoLocation> {
    const { data } = await axiosInstance.put<unknown>(`/geocontext/locations/${id}/status`, { status });
    return unwrapEnvelope<GeoLocation>(data);
  },

  async bulkSetLocationStatus(ids: string[], status: GeoStatus): Promise<{ updated: number }> {
    const { data } = await axiosInstance.put<unknown>("/geocontext/locations/bulk/status", { ids, status });
    return unwrapEnvelope<{ updated: number }>(data);
  },

  async bulkDeleteLocations(ids: string[]): Promise<{ deleted: number }> {
    const { data } = await axiosInstance.delete<unknown>("/geocontext/locations/bulk", { data: { ids } });
    return unwrapEnvelope<{ deleted: number }>(data);
  },

  async addWarning(locationId: string, warning: Omit<LocationWarning, "id" | "createdAt">): Promise<LocationWarning> {
    const { data } = await axiosInstance.post<unknown>(`/geocontext/locations/${locationId}/warnings`, warning);
    return unwrapEnvelope<LocationWarning>(data);
  },

  async deleteWarning(locationId: string, warningId: string): Promise<void> {
    await axiosInstance.delete(`/geocontext/locations/${locationId}/warnings/${warningId}`);
  },

  async getRestrictedZones(): Promise<RestrictedZone[]> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/restricted-zones");
    return unwrapEnvelope<RestrictedZone[]>(data);
  },

  async createRestrictedZone(input: Omit<RestrictedZone, "id" | "createdAt" | "updatedAt">): Promise<RestrictedZone> {
    const { data } = await axiosInstance.post<unknown>("/geocontext/restricted-zones", input);
    return unwrapEnvelope<RestrictedZone>(data);
  },

  async updateRestrictedZone(id: string, input: Partial<RestrictedZone>): Promise<RestrictedZone> {
    const { data } = await axiosInstance.put<unknown>(`/geocontext/restricted-zones/${id}`, input);
    return unwrapEnvelope<RestrictedZone>(data);
  },

  async deleteRestrictedZone(id: string): Promise<void> {
    await axiosInstance.delete(`/geocontext/restricted-zones/${id}`);
  },

  async getBoundaries(): Promise<Boundary[]> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/boundaries");
    return unwrapEnvelope<Boundary[]>(data);
  },

  async createBoundary(input: Omit<Boundary, "id" | "createdAt">): Promise<Boundary> {
    const { data } = await axiosInstance.post<unknown>("/geocontext/boundaries", input);
    return unwrapEnvelope<Boundary>(data);
  },

  async updateBoundary(id: string, input: Partial<Omit<Boundary, "id" | "createdAt">>): Promise<Boundary> {
    const { data } = await axiosInstance.put<unknown>(`/geocontext/boundaries/${id}`, input);
    return unwrapEnvelope<Boundary>(data);
  },

  async deleteBoundary(id: string): Promise<void> {
    await axiosInstance.delete(`/geocontext/boundaries/${id}`);
  },

  async getGovernorates(): Promise<{ name: string; nameEn?: string; nameAr?: string }[]> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/governorates");
    return unwrapEnvelope<{ name: string; nameEn?: string; nameAr?: string }[]>(data);
  },

  async getAnalytics(): Promise<GeoAnalytics> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/analytics");
    return unwrapEnvelope<GeoAnalytics>(data);
  },

  async getActivity(): Promise<ActivityEvent[]> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/activity");
    return unwrapEnvelope<ActivityEvent[]>(data);
  },

  async importGeoJSON(fc: GeoJSONFeatureCollection): Promise<{ imported: number }> {
    const { data } = await axiosInstance.post<unknown>("/geocontext/import/geojson", fc);
    return unwrapEnvelope<{ imported: number }>(data);
  },

  async exportGeoJSON(): Promise<GeoJSONFeatureCollection> {
    const { data } = await axiosInstance.get<unknown>("/geocontext/export/geojson");
    return unwrapEnvelope<GeoJSONFeatureCollection>(data);
  },

  async getNearbyServices(locationId: string): Promise<NearbyService[]> {
    const { data } = await axiosInstance.get<unknown>(`/geocontext/locations/${locationId}/nearby-services`);
    return unwrapEnvelope<NearbyService[]>(data);
  },

  async addNearbyService(locationId: string, input: NearbyServiceInput): Promise<NearbyService> {
    const { data } = await axiosInstance.post<unknown>(`/geocontext/locations/${locationId}/nearby-services`, input);
    return unwrapEnvelope<NearbyService>(data);
  },

  async deleteNearbyService(locationId: string, serviceId: string): Promise<void> {
    await axiosInstance.delete(`/geocontext/locations/${locationId}/nearby-services/${serviceId}`);
  },
};
