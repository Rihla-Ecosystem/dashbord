import type { SortOrder } from "./payments";

export type WalletStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type TokenTransactionType =
  | "GRANT"
  | "CONSUME"
  | "REFUND"
  | "BONUS"
  | "ADJUSTMENT";

export type TokenTransactionSource =
  | "CHAT"
  | "IMAGE"
  | "FILE_UPLOAD"
  | "OCR"
  | "VOICE"
  | "PURCHASE"
  | "ADMIN";

export type AdjustmentOperation = "CREDIT" | "DEBIT";

export type WalletSortBy = "tokenBalance" | "createdAt" | "updatedAt";

export interface AdminTokenWalletUser {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  isBanned: boolean;
}

export interface AdminTokenWalletListItem {
  id: string;
  userId: string;
  tokenBalance: number;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
  user: AdminTokenWalletUser;
}

export interface AdminTokenWalletsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminTokenWalletsResult {
  items: AdminTokenWalletListItem[];
  pagination: AdminTokenWalletsPagination;
}

export interface AdminTokenWalletQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: WalletStatus;
  sortBy?: WalletSortBy;
  sortOrder?: SortOrder;
}

export interface TokenSummary {
  remainingTokens: number;
  purchasedTokens: number;
  consumedTokens: number;
  refundedTokens: number;
  netConsumedTokens: number;
  bonusTokens: number;
  adjustmentCredits: number;
  adjustmentDebits: number;
  netAdjustments: number;
}

export interface AdminTokenWalletDetails {
  wallet: {
    id: string | null;
    userId: string;
    tokenBalance: number;
    status: WalletStatus;
    createdAt: string | null;
    updatedAt: string | null;
  };
  user: AdminTokenWalletUser;
  summary: TokenSummary;
}

export interface TokenTransactionMetadata {
  operation?: AdjustmentOperation;
  reason?: string;
  actorId?: string;
  previousBalance?: number;
  newBalance?: number;
  idempotencyKey?: string;
  relatedTransactionId?: string;
}

export interface AdminTokenTransactionItem {
  id: string;
  walletId: string;
  userId: string;
  type: string;
  tokens: number;
  source: string;
  paymentId: string | null;
  referenceId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AdminTokenTransactionsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminTokenTransactionsResult {
  items: AdminTokenTransactionItem[];
  pagination: AdminTokenTransactionsPagination;
}

export interface AdminTokenTransactionsQueryParams {
  page?: number;
  limit?: number;
  type?: TokenTransactionType;
  source?: TokenTransactionSource;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: SortOrder;
}

export interface AdminBonusInput {
  tokens: number;
  reason: string;
  idempotencyKey: string;
}

export interface AdminBonusResult {
  transactionId: string;
  walletId: string;
  userId: string;
  tokensGranted: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  idempotentReplay: boolean;
  createdAt: string;
}

export interface AdminAdjustmentInput {
  operation: AdjustmentOperation;
  tokens: number;
  reason: string;
  idempotencyKey: string;
  paymentId?: string;
  relatedTransactionId?: string;
}

export interface AdminAdjustmentResult {
  transactionId: string;
  walletId: string;
  userId: string;
  operation: AdjustmentOperation;
  tokensAdjusted: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  paymentId: string | null;
  relatedTransactionId: string | null;
  idempotentReplay: boolean;
  createdAt: string;
}
