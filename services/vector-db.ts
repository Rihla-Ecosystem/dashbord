import { axiosInstance } from "./axios";
import { buildQueryString } from "@/utils";

export const vectorDbApi = {
  getCollections: async () => {
    const { data } = await axiosInstance.get(`/ai-service/ingest/collections`);
    return data as Array<{
      name: string;
      points_count: number;
      vectors_size: number;
    }>;
  },

  getPoints: async (
    collectionName: string,
    params?: { offset?: number; limit?: number }
  ) => {
    const query = buildQueryString(params ?? {});
    const { data } = await axiosInstance.get(
      `/ai-service/ingest/collections/${collectionName}/points${query}`
    );
    return data as Array<{
      id: number;
      payload: Record<string, unknown>;
      score?: number;
    }>;
  },

  uploadFile: async (formData: FormData) => {
    const { data } = await axiosInstance.post(`/ai-service/ingest`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteCollection: async (collectionName: string) => {
    const { data } = await axiosInstance.delete(
      `/ai-service/ingest/collections/${collectionName}`
    );
    return data as { collection: string; deleted: boolean };
  },

  deletePoint: async (collectionName: string, pointId: number) => {
    const { data } = await axiosInstance.delete(
      `/ai-service/ingest/collections/${collectionName}/points/${pointId}`
    );
    return data as { collection: string; deleted: boolean };
  },
};