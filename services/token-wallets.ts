import { axiosInstance } from "./axios";
import type { ApiResponse } from "@/types/api";
import type {
  AdminAdjustmentInput,
  AdminAdjustmentResult,
  AdminBonusInput,
  AdminBonusResult,
  AdminTokenWalletDetails,
  AdminTokenWalletQueryParams,
  AdminTokenTransactionsQueryParams,
  PaginatedAdminTokenTransactionsResult,
  PaginatedAdminTokenWalletsResult,
} from "@/types/admin-token-wallet";

export const tokenWalletsApi = {
  list: (params: AdminTokenWalletQueryParams = {}) =>
    axiosInstance.get<ApiResponse<PaginatedAdminTokenWalletsResult>>(
      "/admin/token-wallets",
      { params }
    ),

  getDetails: (userId: string) =>
    axiosInstance.get<ApiResponse<AdminTokenWalletDetails>>(
      `/admin/token-wallets/${userId}`
    ),

  getTransactions: (
    userId: string,
    params: AdminTokenTransactionsQueryParams = {}
  ) =>
    axiosInstance.get<
      ApiResponse<PaginatedAdminTokenTransactionsResult>
    >(`/admin/token-wallets/${userId}/transactions`, { params }),

  grantBonus: (userId: string, input: AdminBonusInput) =>
    axiosInstance.post<ApiResponse<AdminBonusResult>>(
      `/admin/token-wallets/${userId}/bonus`,
      input
    ),

  createAdjustment: (userId: string, input: AdminAdjustmentInput) =>
    axiosInstance.post<ApiResponse<AdminAdjustmentResult>>(
      `/admin/token-wallets/${userId}/adjustments`,
      input
    ),
};
