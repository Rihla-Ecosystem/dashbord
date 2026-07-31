import { axiosInstance } from "./axios";
import type { ApiResponse } from "@/types/api";
import type {
  AdminPaymentDetails,
  AdminPaymentsQueryParams,
  PaginatedAdminPaymentsResult,
} from "@/types/payments";

export const paymentsApi = {
  list: (params: AdminPaymentsQueryParams = {}) =>
    axiosInstance.get<ApiResponse<PaginatedAdminPaymentsResult>>(
      "/admin/payments",
      { params }
    ),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<AdminPaymentDetails>>(
      `/admin/payments/${encodeURIComponent(id)}`
    ),
};
