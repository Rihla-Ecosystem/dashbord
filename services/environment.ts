import { axiosInstance } from "./axios";
import type { EnvironmentData } from "@/types";

export const environmentApi = {
  get: async (params?: { lat: number; lon: number }) => {
    const query = params ? `?lat=${params.lat}&lon=${params.lon}` : "";
    const { data } = await axiosInstance.get<EnvironmentData>(`/env${query}`);
    return data;
  },
};
