// AI Usage Types
export interface AiUsageSummary {
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AiUsageDailyItem {
  day: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  calls: number;
}

export interface AiUsagePerUserItem {
  user: {
    id: string;
    displayName: string | null;
    email: string | null;
  };
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AiUsagePerModelItem {
  model: string;
  source: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AiUsageRecentItem {
  id: string;
  user: { displayName: string | null; email: string | null } | null;
  source: string;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: string | Date;
}

export interface AiUsageResponse {
  summary: AiUsageSummary;
  daily: AiUsageDailyItem[];
  perDay?: AiUsageDailyItem[];
  perUser: AiUsagePerUserItem[];
  perModel: AiUsagePerModelItem[];
  recent: AiUsageRecentItem[];
}

// Shadow Pricing Types
export type RequestCategory =
  | 'FULLY_PRICED'
  | 'PARTIALLY_PRICED'
  | 'UNPRICED'
  | 'ZERO_PROVIDER_CALLS';

export type RequestSummaryStatus =
  | 'FULLY_PRICED'
  | 'PARTIALLY_PRICED'
  | 'UNPRICED';

export type UnpricedReason =
  | 'PROVIDER_NOT_IN_RATECARD'
  | 'MODEL_MISSING'
  | 'ACTUAL_MODEL_NOT_IN_RATECARD'
  | 'REQUESTED_MODEL_NOT_IN_RATECARD'
  | 'USAGE_MISSING'
  | 'USAGE_INVALID'
  | 'RATE_NOT_ACTIVE'
  | 'UNIT_UNPRICED'
  | 'MODALITY_INVALID'
  | 'OVERFLOW';

export type AttemptRiskStatus = 'SAFE' | 'FAILED' | 'INDETERMINATE' | 'RETRY';

export interface MetricsMoney {
  nanoUsd: string;
  microUsd: string;
  usd: string;
}

export interface ShadowPricingWindow {
  storage: 'IN_MEMORY';
  ephemeral: true;
  perProcess: true;
  capacity: number;
  retainedObservations: number;
  oldestObservedAt?: string;
  newestObservedAt?: string;
}

export interface ShadowPricingRequests {
  totalObserved: number;
  fullyPriced: number;
  partiallyPriced: number;
  unpriced: number;
  zeroProviderCalls: number;
}

export interface ShadowPricingProviderCalls {
  totalRealCalls: number;
  pricedCalls: number;
  unpricedCalls: number;
  coverageAvailable: boolean;
  coverageBasisPoints: number | null;
  coveragePercent: string | null;
}

export interface ShadowPricingAttempts {
  totalAttempts: number;
  succeeded: number;
  failed: number;
  indeterminate: number;
  retryContainingRequests: number;
  indeterminateCostRisk: number;
  byProvider: Record<string, number>;
  byOperation: Record<string, number>;
  byRequestedModel: Record<string, number>;
  byActualModel: Record<string, number>;
  byErrorCategory: Record<string, number>;
}

export interface ShadowPricingSourceBreakdown {
  source: string;
  totalObserved: number;
  fullyPriced: number;
  partiallyPriced: number;
  unpriced: number;
  zeroProviderCalls: number;
  pricedProviderCost: MetricsMoney;
}

export interface ShadowPricingProviderBreakdown {
  provider: string;
  totalRealCalls: number;
  pricedCalls: number;
  unpricedCalls: number;
  pricedProviderCost: MetricsMoney;
}

export interface ShadowPricingModelBreakdown {
  model: string;
  totalRealCalls: number;
  pricedCalls: number;
  unpricedCalls: number;
  pricedProviderCost: MetricsMoney;
}

export interface ShadowPricingStatusBreakdown {
  summaryStatus: RequestSummaryStatus;
  count: number;
}

export interface ShadowPricingRateCardVersion {
  version: string;
  count: number;
}

export interface ShadowPricingSummary {
  generatedAt: string;
  window: ShadowPricingWindow;
  requests: ShadowPricingRequests;
  providerCalls: ShadowPricingProviderCalls;
  attempts: ShadowPricingAttempts;
  pricedProviderCost: MetricsMoney;
  unpricedReasons: Record<string, number>;
  bySource: ShadowPricingSourceBreakdown[];
  byProvider: ShadowPricingProviderBreakdown[];
  byModel: ShadowPricingModelBreakdown[];
  bySummaryStatus: ShadowPricingStatusBreakdown[];
  rateCardVersions: ShadowPricingRateCardVersion[];
}

export interface ShadowPricingObservationsQuery {
  limit?: number;
  source?: string;
  status?: RequestCategory;
  noProviderCalls?: boolean;
}

export interface ShadowPricingObservationRow {
  observedAt: string;
  source: string;
  conversationId?: string;
  engineSummaryStatus: RequestSummaryStatus;
  requestCategory: RequestCategory;
  noProviderCalls: boolean;
  callCount: number;
  pricedCallCount: number;
  unpricedCallCount: number;
  pricedProviderCost: MetricsMoney;
  unpricedReasons: Record<string, number>;
  rateCardVersion: string;
  attemptRiskStatus: AttemptRiskStatus;
  attemptCount: number;
  failedAttemptCount: number;
  indeterminateAttemptCount: number;
  hasRetry: boolean;
}

export interface ShadowPricingObservationMeta {
  returned: number;
  limit: number;
  storage: 'IN_MEMORY';
  ephemeral: true;
  perProcess: true;
  capacity: number;
}

export interface ShadowPricingObservationsResult {
  data: ShadowPricingObservationRow[];
  meta: ShadowPricingObservationMeta;
}

export interface ShadowPricingRecomputeBody {
  from: string;
  to: string;
  limit?: number;
}

export type RecomputeRowOutcome =
  | 'RECOMPUTED_PRICED'
  | 'RECOMPUTED_UNPRICED'
  | 'SKIPPED_MISSING_PROVIDER_IDENTITY'
  | 'SKIPPED_MISSING_MODEL_IDENTITY'
  | 'SKIPPED_MISSING_USAGE'
  | 'SKIPPED_INVALID_USAGE'
  | 'SKIPPED_UNSUPPORTED_LEGACY_SHAPE';

export type ShadowComparisonStatus =
  | 'MATCH'
  | 'MISMATCH'
  | 'DB_NOT_FOUND'
  | 'DB_CONFLICT'
  | 'DB_VERSION_NOT_FOUND'
  | 'DB_INVALID'
  | 'DB_ERROR'
  | 'DB_PRICING_ERROR';

export interface RecomputeShadowComparison {
  status: ShadowComparisonStatus;
  selectionMode: 'ACTIVE_DATE' | 'EXPLICIT_VERSION';
  staticRateCardVersion: string;
  databaseRateCardVersion: string | null;
  staticTotalCostNanoUsd: string;
  databaseTotalCostNanoUsd: string | null;
  deltaNanoUsd: string | null;
  mismatchCategories: string[];
}

export interface RecomputeRowResult {
  id: string;
  outcome: RecomputeRowOutcome;
  staticReport: unknown;
  shadowComparison?: RecomputeShadowComparison;
}

export interface RecomputePreviewResult {
  mode: 'READ_ONLY_PREVIEW';
  requestAggregationAvailable: false;
  selection: {
    from: string;
    to: string;
    requestedLimit: number;
    appliedLimit: number;
  };
  rows: {
    scanned: number;
    recomputedPriced: number;
    recomputedUnpriced: number;
    skipped: number;
    shadowComparisons: {
      match: number;
      mismatch: number;
      dbNotFound: number;
      dbConflict: number;
      dbVersionNotFound: number;
      dbInvalid: number;
      dbError: number;
      dbPricingError: number;
    };
  };
  pricedProviderCost: MetricsMoney;
  unpricedReasons: Record<string, number>;
  skipReasons: Record<string, number>;
  rowResults: RecomputeRowResult[];
  warnings: string[];
}

// Rate Cards Types
export type RateCardStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

export type RateCardEntryStatus =
  | 'STABLE'
  | 'PREVIEW'
  | 'DEPRECATED'
  | 'LIMITED_AVAILABILITY';

export type RateCardTier = 'standard' | 'batch' | 'priority' | 'fast_mode';

export type RateCardBillingUnit =
  | 'TOKEN'
  | 'IMAGE'
  | 'SECOND'
  | 'MINUTE'
  | 'CHARACTER';

export type CachedInputAccounting = 'DISJOINT' | 'INCLUDED_IN_INPUT';

export interface RateCardSnapshotMetadata {
  id: string;
  version: string;
  status: RateCardStatus;
  source: string;
  generatedAt: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  publishedAt: string | null;
  retiredAt: string | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
  idempotentReplay?: boolean;
}

export interface RateCardTokenRates {
  inputMicrosPerMillion?: string | null;
  outputMicrosPerMillion?: string | null;
  cachedInputMicrosPerMillion?: string | null;
  cachedOutputMicrosPerMillion?: string | null;
}

export interface RateCardModalityRates {
  audioInputMicrosPerMillion?: string | null;
}

export interface RateCardTts {
  audioOutputMicrosPerMillion?: string | null;
  tokensPerSecond?: number;
}

export interface RateCardEntry {
  id?: string;
  provider: string;
  model: string;
  aliases?: string[];
  status: RateCardEntryStatus;
  tier?: RateCardTier;
  billingUnit: RateCardBillingUnit;
  tokenRates?: RateCardTokenRates;
  perUnitMicros?: string | null;
  modalityRates?: RateCardModalityRates;
  tts?: RateCardTts;
  cachedInputAccounting?: CachedInputAccounting;
  effectiveFrom: string;
  effectiveTo?: string | null;
  inactive: boolean;
  source?: string | null;
  verifiedAt?: string | null;
  adminReason?: string;
}

export interface RateCardSnapshotDetail extends RateCardSnapshotMetadata {
  entries: RateCardEntry[];
  providers: string[];
  mappingError: { code: string; message: string } | null;
}

export interface RateCardListQuery {
  page?: number;
  limit?: number;
  status?: RateCardStatus;
}

export interface RateCardListResult {
  items: RateCardSnapshotMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateRateCardDraftRequest {
  version: string;
  source: string;
  generatedAt: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CloneRateCardRequest {
  newVersion: string;
}

export interface CreateRateCardEntryRequest {
  provider: string;
  model: string;
  aliases?: string[];
  status: RateCardEntryStatus;
  tier?: RateCardTier;
  billingUnit: RateCardBillingUnit;
  tokenRates?: RateCardTokenRates;
  perUnitMicros?: string;
  modalityRates?: RateCardModalityRates;
  tts?: RateCardTts;
  cachedInputAccounting?: CachedInputAccounting;
  effectiveFrom: string;
  effectiveTo?: string;
  inactive: boolean;
  source?: string;
  verifiedAt?: string;
  adminReason: string;
}

export interface ImportRateCardEntriesRequest {
  source: string;
  generatedAt: string;
  entries: CreateRateCardEntryRequest[];
}

export type UpdateRateCardEntryRequest = Partial<CreateRateCardEntryRequest>;

export interface RateCardValidationResult {
  valid: boolean;
  card?: unknown;
  providers?: string[];
  entryCount?: number;
}

export interface PublishRateCardRequest {
  effectiveFrom?: string;
  effectiveTo?: string;
  replaceActiveVersion?: string;
}

export interface RetireRateCardRequest {
  retiredAt?: string;
  effectiveTo?: string;
}

// Billing Recovery Types
export type TokenReservationStatus = 'PENDING' | 'COMPLETED' | 'RELEASED';

export type AIBillingMetadataStatus = 'VALID' | 'MISSING' | 'INVALID';

export type AIBillingRecoveryReasonCode =
  | 'RESOLVED'
  | 'PENDING_REVIEW'
  | 'METADATA_MISSING'
  | 'METADATA_INVALID'
  | 'INTEGRITY_CONFLICT';

export interface BillingRecoveryQueueQuery {
  page?: number;
  limit?: number;
  status?: TokenReservationStatus;
  feature?: string;
}

export interface BillingRecoveryQueueItem {
  reservationId: string;
  referenceId: string;
  walletId: string;
  userId: string;
  feature: string;
  source: string;
  reservationStatus: TokenReservationStatus;
  reservedTokens: number;
  pricingVersion: number;
  expiresAt: string;
  isExpired: boolean;
  metadataStatus: AIBillingMetadataStatus;
  reasonCode: AIBillingRecoveryReasonCode;
  requestedMode?: string;
  quoteAppliedMode?: string;
  provider?: string;
  model?: string;
  billingCurrency?: string;
  rateCardVersion?: string;
  walletPolicyVersion?: string;
}

export interface BillingRecoveryQueueAggregate {
  count: number;
  totalTokens: number;
}

export interface BillingRecoveryQueueResult {
  items: BillingRecoveryQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregate: BillingRecoveryQueueAggregate;
  totals?: BillingRecoveryQueueAggregate;
}
