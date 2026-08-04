import { axiosInstance } from "./axios";
import type { AdminAssistantResponse } from "@/types";

function unwrapEnvelope<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    const record = envelope as Record<string, unknown>;
    if (record.success && "data" in record) return record.data as T;
  }
  return envelope as T;
}

export const assistantApi = {
  ask: async (question: string): Promise<AdminAssistantResponse> => {
    const { data } = await axiosInstance.post(`/admin/enterprise/assistant`, { question });
    return unwrapEnvelope<AdminAssistantResponse>(data);
  },
};
