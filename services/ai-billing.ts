import { axiosInstance } from "./axios";
import { buildQueryString } from "@/utils";
import type {
  AiUsageResponse,
  BillingRecoveryQueueQuery,
  BillingRecoveryQueueResult,
  CloneRateCardRequest,
  CreateRateCardDraftRequest,
  CreateRateCardEntryRequest,
  ImportRateCardEntriesRequest,
  PublishRateCardRequest,
  RateCardListQuery,
  RateCardListResult,
  RateCardSnapshotDetail,
  RateCardSnapshotMetadata,
  RateCardValidationResult,
  RetireRateCardRequest,
  ShadowPricingObservationsQuery,
  ShadowPricingObservationsResult,
  ShadowPricingRecomputeBody,
  ShadowPricingSummary,
  RecomputePreviewResult,
  UpdateRateCardEntryRequest,
} from "@/types/ai-billing";

/**
 * Envelope unwrapper for endpoints returning `{ success: true, data: T }`.
 */
function unwrapSuccessData<T>(responseData: { success?: boolean; data?: T } | T): T {
  if (responseData && typeof responseData === "object" && "success" in responseData && "data" in responseData) {
    return (responseData as { success: boolean; data: T }).data as T;
  }
  return responseData as T;
}

export const aiBillingApi = {
  // ---------------------------------------------------------------------------
  // 1. AI Usage (Direct Payload)
  // ---------------------------------------------------------------------------
  getAiUsageSummary: async (): Promise<AiUsageResponse> => {
    const { data } = await axiosInstance.get<AiUsageResponse>("/admin/ai-usage");
    return data;
  },

  // ---------------------------------------------------------------------------
  // 2. Shadow Pricing (Direct Payload)
  // ---------------------------------------------------------------------------
  getShadowPricingSummary: async (): Promise<ShadowPricingSummary> => {
    const { data } = await axiosInstance.get<ShadowPricingSummary>(
      "/admin/ai-shadow-pricing/summary"
    );
    return data;
  },

  getShadowPricingObservations: async (
    params?: ShadowPricingObservationsQuery
  ): Promise<ShadowPricingObservationsResult> => {
    const { data } = await axiosInstance.get<ShadowPricingObservationsResult>(
      `/admin/ai-shadow-pricing/observations${buildQueryString((params as Record<string, unknown>) ?? {})}`
    );
    return data;
  },

  recomputeShadowPricingPreview: async (
    body: ShadowPricingRecomputeBody
  ): Promise<RecomputePreviewResult> => {
    const { data } = await axiosInstance.post<RecomputePreviewResult>(
      "/admin/ai-shadow-pricing/recompute-preview",
      body
    );
    return data;
  },

  // ---------------------------------------------------------------------------
  // 3. Rate Cards (Success Data Envelope)
  // ---------------------------------------------------------------------------
  getRateCards: async (
    params?: RateCardListQuery
  ): Promise<RateCardListResult> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: RateCardListResult }>(
      `/admin/rate-cards${buildQueryString((params as Record<string, unknown>) ?? {})}`
    );
    return unwrapSuccessData<RateCardListResult>(data);
  },

  getRateCardByVersion: async (
    version: string
  ): Promise<RateCardSnapshotDetail> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: RateCardSnapshotDetail }>(
      `/admin/rate-cards/${encodeURIComponent(version)}`
    );
    return unwrapSuccessData<RateCardSnapshotDetail>(data);
  },

  createRateCardDraft: async (
    body: CreateRateCardDraftRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      "/admin/rate-cards/drafts",
      body
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  cloneRateCard: async (
    sourceVersion: string,
    body: CloneRateCardRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/${encodeURIComponent(sourceVersion)}/clone`,
      body
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  importRateCardEntries: async (
    version: string,
    body: ImportRateCardEntriesRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/drafts/${encodeURIComponent(version)}/import`,
      body
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  createRateCardEntry: async (
    version: string,
    entry: CreateRateCardEntryRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/drafts/${encodeURIComponent(version)}/entries`,
      entry
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  updateRateCardEntry: async (
    version: string,
    entryId: string,
    patch: UpdateRateCardEntryRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.patch<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/drafts/${encodeURIComponent(version)}/entries/${encodeURIComponent(entryId)}`,
      patch
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  deleteRateCardEntry: async (
    version: string,
    entryId: string
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.delete<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/drafts/${encodeURIComponent(version)}/entries/${encodeURIComponent(entryId)}`
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  validateRateCardDraft: async (
    version: string
  ): Promise<RateCardValidationResult> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardValidationResult }>(
      `/admin/rate-cards/drafts/${encodeURIComponent(version)}/validate`
    );
    return unwrapSuccessData<RateCardValidationResult>(data);
  },

  publishRateCard: async (
    version: string,
    body?: PublishRateCardRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/${encodeURIComponent(version)}/publish`,
      body ?? {}
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  retireRateCard: async (
    version: string,
    body?: RetireRateCardRequest
  ): Promise<RateCardSnapshotMetadata> => {
    const { data } = await axiosInstance.post<{ success: boolean; data: RateCardSnapshotMetadata }>(
      `/admin/rate-cards/${encodeURIComponent(version)}/retire`,
      body ?? {}
    );
    return unwrapSuccessData<RateCardSnapshotMetadata>(data);
  },

  // ---------------------------------------------------------------------------
  // 4. Billing Recovery (Success Data Envelope - Read Only)
  // ---------------------------------------------------------------------------
  getBillingRecoveryQueue: async (
    params?: BillingRecoveryQueueQuery
  ): Promise<BillingRecoveryQueueResult> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: BillingRecoveryQueueResult }>(
      `/admin/billing-recovery/queue${buildQueryString((params as Record<string, unknown>) ?? {})}`
    );
    return unwrapSuccessData<BillingRecoveryQueueResult>(data);
  },
};
