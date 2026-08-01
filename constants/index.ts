export const APP_NAME = "Rihla Admin";
export const APP_DESCRIPTION = "Enterprise admin dashboard for Rihla platform";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export const TOKEN_KEYS = {
  ACCESS: "rihla_access_token",
  REFRESH: "rihla_refresh_token",
} as const;

export const ROLES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  USER: "USER",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  USER: "User",
};

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export const QUERY_KEYS = {
  profile: ["profile"] as const,
  users: (params?: unknown) => ["users", params] as const,
  dashboardUsers: (params?: unknown) => ["dashboard-users", params] as const,
  user: (id: string) => ["user", id] as const,
  dashboardUser: (id: string) => ["dashboard-user", id] as const,
  dashboardUserStats: (id: string) => ["dashboard-user-stats", id] as const,
  userBadges: (id: string) => ["user-badges", id] as const,
  auditLogs: (params?: unknown) => ["audit-logs", params] as const,
  dashboardStats: ["dashboard-stats"] as const,
  dashboardActivity: (params?: unknown) => ["dashboard-activity", params] as const,
  dashboardGrowth: (params?: unknown) => ["dashboard-growth", params] as const,
  dashboardRevenue: (params?: unknown) => ["dashboard-revenue", params] as const,
  dashboardCountries: ["dashboard-countries"] as const,
  dashboardLanguages: ["dashboard-languages"] as const,
  dashboardRetention: ["dashboard-retention"] as const,
  dashboardTopUsers: ["dashboard-top-users"] as const,
  environment: ["environment"] as const,
  geoSearch: (params?: unknown) => ["geo-search", params] as const,
  geoPois: (params?: unknown) => ["geo-pois", params] as const,
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/users", label: "Users", icon: "users", roles: ["ADMIN", "MODERATOR"] },
  { href: "/roles", label: "Roles", icon: "roles", roles: ["ADMIN"] },
  { href: "/badges", label: "Badges", icon: "badges", roles: ["ADMIN", "MODERATOR"] },
  { href: "/geo", label: "Geo Services", icon: "geo" },
  { href: "/geo-context/restricted-zones", label: "Restricted zones", icon: "geo" },
  { href: "/environment", label: "Environment", icon: "environment" },
  { href: "/audit-logs", label: "Audit Logs", icon: "audit", roles: ["ADMIN", "MODERATOR"] },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/analytics",
  "/users",
  "/roles",
  "/badges",
  "/geo",
  "/geo-context",
  "/environment",
  "/audit-logs",
  "/settings",
  "/profile",
] as const;
