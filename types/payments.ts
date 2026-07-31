export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentSortBy =
  | "createdAt"
  | "updatedAt"
  | "amount"
  | "paidAt";

export type SortOrder = "asc" | "desc";

export interface AdminPaymentUser {
  id: string;
  displayName: string | null;
  email: string;
}

export interface AdminPaymentTokenPackage {
  id: number;
  name: string;
  code: string;
}

export interface AdminPaymentListItem {
  id: string;
  userId: string;
  tokenPackageId: number;
  amount: string;
  currency: string;
  status: PaymentStatus;
  packageNameSnapshot: string;
  tokensSnapshot: number;
  priceSnapshot: string;
  currencySnapshot: string;
  provider: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminPaymentUser;
  tokenPackage: AdminPaymentTokenPackage;
}

export interface AdminPaymentDetails extends AdminPaymentListItem {
  providerIntentionId: string | null;
  providerOrderId: string | null;
  providerTransactionId: string | null;
  failureReason: string | null;
}

export interface AdminPaymentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminPaymentsResult {
  items: AdminPaymentListItem[];
  pagination: AdminPaymentsPagination;
}

export interface AdminPaymentsQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  currency?: string;
  tokenPackageId?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: PaymentSortBy;
  sortOrder?: SortOrder;
}
