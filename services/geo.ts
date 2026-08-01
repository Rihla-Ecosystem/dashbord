import { axiosInstance } from "./axios";
import type { GeoPoiRequest, GeoSearchRequest } from "@/types";
import { buildQueryString } from "@/utils";
import { normalizeGeoPlaces } from "./transformers";

export const geoApi = {
  search: async (params: GeoSearchRequest) => {
    const { data } = await axiosInstance.get<unknown>(`/geo/search${buildQueryString(params)}`);
    return normalizeGeoPlaces(data);
  },

  getPois: async (params: GeoPoiRequest) => {
    const { data } = await axiosInstance.get<unknown>(`/geo/pois${buildQueryString(params)}`);
    return normalizeGeoPlaces(data);
  },
};
