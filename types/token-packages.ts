import type { SortOrder } from "./payments";

export type TokenPackageSortBy =
  | "name"
  | "price"
  | "tokens"
  | "sortOrder"
  | "createdAt"
  | "updatedAt";

export interface AdminTokenPackage {
  id: number;
  name: string;
  description: string | null;
  code: string;
  price: string;
  currency: string;
  tokens: number;
  sortOrder: number;
  isActive: boolean;
  paymentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTokenPackagesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminTokenPackagesResult {
  items: AdminTokenPackage[];
  pagination: AdminTokenPackagesPagination;
}

export interface AdminTokenPackagesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
  currency?: string;
  sortBy?: TokenPackageSortBy;
  sortOrder?: SortOrder;
}

export interface CreateAdminTokenPackageInput {
  name: string;
  description?: string;
  code: string;
  price: string;
  currency: "EGP";
  tokens: number;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateAdminTokenPackageInput {
  name?: string;
  description?: string | null;
  price?: string;
  currency?: "EGP";
  tokens?: number;
  sortOrder?: number;
}

export interface UpdateAdminTokenPackageStatusInput {
  isActive: boolean;
}

export interface DeletedAdminTokenPackage {
  id: number;
  code: string;
  deleted: true;
}
