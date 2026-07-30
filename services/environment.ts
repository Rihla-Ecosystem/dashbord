import { axiosInstance } from "./axios";
import type { EnvironmentData } from "@/types";

export const environmentApi = {
  get: () => axiosInstance.get<EnvironmentData>("/env"),
};
