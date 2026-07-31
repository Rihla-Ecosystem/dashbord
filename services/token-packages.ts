import { axiosInstance } from "./axios";
import type { ApiResponse } from "@/types/api";
import type {
  AdminTokenPackage,
  AdminTokenPackagesQueryParams,
  CreateAdminTokenPackageInput,
  DeletedAdminTokenPackage,
  PaginatedAdminTokenPackagesResult,
  UpdateAdminTokenPackageInput,
  UpdateAdminTokenPackageStatusInput,
} from "@/types/token-packages";

export const tokenPackagesApi = {
  list: (params: AdminTokenPackagesQueryParams = {}) =>
    axiosInstance.get<ApiResponse<PaginatedAdminTokenPackagesResult>>(
      "/admin/token-packages",
      { params }
    ),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<AdminTokenPackage>>(
      `/admin/token-packages/${id}`
    ),

  create: (input: CreateAdminTokenPackageInput) =>
    axiosInstance.post<ApiResponse<AdminTokenPackage>>(
      "/admin/token-packages",
      input
    ),

  update: (id: number, input: UpdateAdminTokenPackageInput) =>
    axiosInstance.patch<ApiResponse<AdminTokenPackage>>(
      `/admin/token-packages/${id}`,
      input
    ),

  updateStatus: (id: number, input: UpdateAdminTokenPackageStatusInput) =>
    axiosInstance.patch<ApiResponse<AdminTokenPackage>>(
      `/admin/token-packages/${id}/status`,
      input
    ),

  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<DeletedAdminTokenPackage>>(
      `/admin/token-packages/${id}`
    ),
};
