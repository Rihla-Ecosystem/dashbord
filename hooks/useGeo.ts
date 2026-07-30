"use client";

import { useQuery } from "@tanstack/react-query";
import { geoApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import type { GeoPoiParams, GeoSearchParams } from "@/types";

export function useGeoSearch(params: GeoSearchParams, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.geoSearch(params),
    queryFn: () => geoApi.search(params).then((r) => r.data),
    enabled: enabled && !!params.q,
  });
}

export function useGeoPois(params: GeoPoiParams, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.geoPois(params),
    queryFn: () => geoApi.getPois(params).then((r) => r.data),
    enabled: enabled && !!params.lat && !!params.lng,
  });
}
