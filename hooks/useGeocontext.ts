"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { geocontextApi, type LocationQuery, type PaginatedLocations } from "@/services/geocontext";
import { GEO_QUERY_KEYS } from "@/constants/geocontext";
import { fetchWeather } from "@/features/geocontext/weather";
import type {
  GeoJSONFeatureCollection,
  GeoLocation,
  LocationInput,
  LocationWarning,
  NearbyServiceInput,
  RestrictedZone,
} from "@/types/geocontext";

function patchLocationCache(queryClient: ReturnType<typeof useQueryClient>, id: string, patch: Partial<GeoLocation>) {
  queryClient.setQueriesData<PaginatedLocations>({ queryKey: ["geocontext", "locations"] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      data: old.data.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    };
  });
  queryClient.setQueryData<GeoLocation>(GEO_QUERY_KEYS.location(id), (old) => (old ? { ...old, ...patch } : old));
}

function addLocationToCache(queryClient: ReturnType<typeof useQueryClient>, location: GeoLocation) {
  queryClient.setQueriesData<PaginatedLocations>({ queryKey: ["geocontext", "locations"] }, (old) => {
    if (!old) return old;
    return { ...old, data: [location, ...old.data], total: old.total + 1 };
  });
}

function removeLocationFromCache(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.setQueriesData<PaginatedLocations>({ queryKey: ["geocontext", "locations"] }, (old) => {
    if (!old) return old;
    return { ...old, data: old.data.filter((l) => l.id !== id), total: old.total - 1 };
  });
  queryClient.removeQueries({ queryKey: GEO_QUERY_KEYS.location(id) });
}

export function useGeoLocations(query?: LocationQuery) {
  return useQuery({
    queryKey: ["geocontext", "locations", query],
    queryFn: () => geocontextApi.getLocations(query),
  });
}

export function useGeoLocation(id: string | null) {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.location(id ?? ""),
    queryFn: () => geocontextApi.getLocation(id as string),
    enabled: !!id,
  });
}

export function useGeoRestrictedZones() {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.restrictedZones,
    queryFn: () => geocontextApi.getRestrictedZones(),
  });
}

export function useGeoBoundaries() {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.boundaries,
    queryFn: () => geocontextApi.getBoundaries(),
  });
}

export function useGeoAnalytics() {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.analytics,
    queryFn: () => geocontextApi.getAnalytics(),
  });
}

export function useGeoActivity() {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.activity,
    queryFn: () => geocontextApi.getActivity(),
  });
}

export function useCreateGeoLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LocationInput) => geocontextApi.createLocation(input),
    onSuccess: (location) => {
      addLocationToCache(qc, location);
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useUpdateGeoLocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<LocationInput>) => geocontextApi.updateLocation(id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      patchLocationCache(qc, id, input as Partial<GeoLocation>);
    },
    onSuccess: (location) => {
      patchLocationCache(qc, id, location);
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useDeleteGeoLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => geocontextApi.deleteLocation(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      removeLocationFromCache(qc, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useSetGeoLocationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: GeoLocation["status"]) => geocontextApi.setLocationStatus(id, status),
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      patchLocationCache(qc, id, { status } as Partial<GeoLocation>);
    },
    onSuccess: (location) => {
      patchLocationCache(qc, id, location);
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useBulkGeoLocationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: GeoLocation["status"] }) =>
      geocontextApi.bulkSetLocationStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useBulkDeleteGeoLocations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => geocontextApi.bulkDeleteLocations(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      const idSet = new Set(ids);
      qc.setQueriesData<PaginatedLocations>({ queryKey: ["geocontext", "locations"] }, (old) => {
        if (!old) return old;
        const removed = old.data.filter((l) => idSet.has(l.id)).length;
        return {
          ...old,
          data: old.data.filter((l) => !idSet.has(l.id)),
          total: old.total - removed,
        };
      });
      ids.forEach((id) => qc.removeQueries({ queryKey: GEO_QUERY_KEYS.location(id) }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useAddGeoWarning(locationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warning: Omit<LocationWarning, "id" | "createdAt">) =>
      geocontextApi.addWarning(locationId, warning),
    onMutate: async (warning) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      const temp: LocationWarning = { ...warning, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() };
      patchLocationCache(qc, locationId, { warnings: [...(qc.getQueryData<GeoLocation>(GEO_QUERY_KEYS.location(locationId))?.warnings ?? []), temp] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useAddNearbyService(locationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NearbyServiceInput) => geocontextApi.addNearbyService(locationId, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      const temp = {
        id: `temp-ns-${Date.now()}`,
        locationId,
        name: input.name,
        type: input.type,
        distanceKm: input.distanceKm,
        lat: 0,
        lng: 0,
        rating: input.rating,
        contact: input.contact,
      };
      const existing = qc.getQueryData<GeoLocation>(GEO_QUERY_KEYS.location(locationId));
      patchLocationCache(qc, locationId, { nearby: [...(existing?.nearby ?? []), temp] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useDeleteNearbyService(locationId: string, serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => geocontextApi.deleteNearbyService(locationId, serviceId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      patchLocationCache(qc, locationId, {
        nearby: (qc.getQueryData<GeoLocation>(GEO_QUERY_KEYS.location(locationId))?.nearby ?? []).filter(
          (s) => s.id !== serviceId
        ),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useDeleteGeoWarning(locationId: string, warningId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => geocontextApi.deleteWarning(locationId, warningId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["geocontext", "locations"] });
      patchLocationCache(qc, locationId, {
        warnings: (qc.getQueryData<GeoLocation>(GEO_QUERY_KEYS.location(locationId))?.warnings ?? []).filter(
          (w) => w.id !== warningId
        ),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useCreateRestrictedZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<RestrictedZone, "id" | "createdAt" | "updatedAt">) =>
      geocontextApi.createRestrictedZone(input),
    onSuccess: (zone) => {
      qc.setQueryData<RestrictedZone[]>(GEO_QUERY_KEYS.restrictedZones, (old) => (old ? [...old, zone] : [zone]));
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useUpdateRestrictedZone(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RestrictedZone>) => geocontextApi.updateRestrictedZone(id, input),
    onSuccess: (zone) => {
      qc.setQueryData<RestrictedZone[]>(GEO_QUERY_KEYS.restrictedZones, (old) =>
        old ? old.map((z) => (z.id === id ? zone : z)) : old
      );
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useDeleteRestrictedZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => geocontextApi.deleteRestrictedZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.restrictedZones });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useImportGeoJSON() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fc: GeoJSONFeatureCollection) => geocontextApi.importGeoJSON(fc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geocontext", "locations"] });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
      qc.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
    },
  });
}

export function useWeather(lat: number, lng: number, enabled = true) {
  return useQuery({
    queryKey: ["geocontext", "weather", lat, lng],
    queryFn: () => fetchWeather(lat, lng),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: enabled && Number.isFinite(lat) && Number.isFinite(lng),
  });
}

export function useGovernorates() {
  return useQuery({
    queryKey: GEO_QUERY_KEYS.governorates,
    queryFn: () => geocontextApi.getGovernorates(),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
