import { axiosInstance } from "./axios";
import type { GeoPlace, GeoPoiParams, GeoSearchParams } from "@/types";
import { buildQueryString } from "@/utils";

export const geoApi = {
  search: (params: GeoSearchParams) =>
    axiosInstance.get<GeoPlace[]>(`/geo/search${buildQueryString(params)}`),

  getPois: (params: GeoPoiParams) =>
    axiosInstance.get<GeoPlace[]>(`/geo/pois${buildQueryString(params)}`),
};
