import type {
  ApiAuditLog,
  ApiBadge,
  ApiUser,
  ApiUserRole,
  AuditLog,
  Badge,
  DashboardSeriesPoint,
  EnvironmentData,
  GeoPlace,
  PaginatedResponse,
  User,
  UserRole,
} from "@/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeRole(value: unknown): UserRole {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper === "ADMIN" || upper === "MODERATOR") return upper;
  }

  if (typeof value === "number") {
    if (value === 1) return "USER";
    if (value === 2) return "MODERATOR";
    if (value === 3) return "ADMIN";
  }

  if (value && typeof value === "object" && "name" in value) {
    return normalizeRole((value as ApiUserRole).name);
  }

  return "USER";
}

export function normalizeUser(raw: unknown): User {
  const apiUser = raw as Partial<ApiUser> & Record<string, unknown>;
  const roleValue = apiUser.role ?? apiUser.roleId;

  return {
    id: asString(apiUser.id),
    email: asString(apiUser.email),
    name: asString(apiUser.displayName ?? apiUser.name, asString(apiUser.email)),
    avatar: (apiUser.avatarUrl ?? apiUser.avatar ?? null) as string | null | undefined,
    role: normalizeRole(roleValue),
    bio: (apiUser.bio ?? null) as string | null | undefined,
    nationality: (apiUser.nationality ?? null) as string | null | undefined,
    languages: asStringArray(apiUser.language ?? apiUser.languages),
    travelStyle: (apiUser.travelStyle ?? null) as string | null | undefined,
    budget: (apiUser.budgetLevel ?? apiUser.budget ?? null) as string | null | undefined,
    accommodation: (apiUser.accommodationType ?? apiUser.accommodation ?? null) as string | null | undefined,
    arrival: (apiUser.arrivalDate ?? apiUser.arrival ?? null) as string | null | undefined,
    departure: (apiUser.departureDate ?? apiUser.departure ?? null) as string | null | undefined,
    gender: (apiUser.gender ?? null) as User["gender"],
    xp: asNumber(apiUser.xp),
    level: asNumber(apiUser.level, 1),
    verified: Boolean(apiUser.isEmailVerified ?? apiUser.verified),
    banned: Boolean(apiUser.banned),
    createdAt: asString(apiUser.createdAt),
    updatedAt: apiUser.updatedAt,
  };
}

export function normalizePaginatedUsers(
  response: { data?: unknown; total?: unknown; page?: unknown; limit?: unknown; totalPages?: unknown }
): PaginatedResponse<User> {
  const data = Array.isArray(response.data) ? response.data : [];

  return {
    data: data.map((item) => normalizeUser(item as ApiUser)),
    total: asNumber(response.total, data.length),
    page: asNumber(response.page, 1),
    limit: asNumber(response.limit, data.length || 1),
    totalPages: asNumber(response.totalPages, 1),
  };
}

export function normalizeBadge(raw: unknown): Badge {
  const apiBadge = raw as Partial<ApiBadge> & Record<string, unknown>;
  return {
    id: asString(apiBadge.id ?? apiBadge.criteriaValue ?? ""),
    name: asString(apiBadge.name),
    description: asString(apiBadge.description),
    icon: (apiBadge.iconUrl ?? undefined) as string | undefined,
    earnedAt: typeof apiBadge.earnedAt === "string" ? apiBadge.earnedAt : undefined,
  };
}

export function normalizeBadgesResponse(response: unknown): Badge[] {
  if (Array.isArray(response)) {
    return response.map((item) => normalizeBadge(item as ApiBadge));
  }

  if (response && typeof response === "object" && "data" in response && Array.isArray((response as { data?: unknown[] }).data)) {
    return (response as { data: unknown[] }).data.map((item) => normalizeBadge(item as ApiBadge));
  }

  return [];
}

export function normalizeAuditLog(raw: unknown): AuditLog {
  const apiLog = raw as Partial<ApiAuditLog> & Record<string, unknown>;
  return {
    id: asString(apiLog.id),
    action: asString(apiLog.action),
    actorId: asString(apiLog.actorId),
    actorName: apiLog.actor?.displayName,
    actorEmail: apiLog.actor?.email,
    targetId: asString(apiLog.targetUserId || apiLog.target?.email),
    targetType: apiLog.target?.displayName ?? apiLog.target?.email ?? undefined,
    metadata: (apiLog.metadata ?? undefined) as Record<string, unknown> | undefined,
    createdAt: asString(apiLog.createdAt),
  };
}

export function normalizeAuditLogsResponse(response: unknown): PaginatedResponse<AuditLog> {
  const entries = Array.isArray(response)
    ? response
    : response && typeof response === "object" && "data" in response && Array.isArray((response as { data?: unknown[] }).data)
      ? (response as { data: unknown[] }).data
      : [];

  const total = response && typeof response === "object" && "total" in response ? asNumber((response as { total?: unknown }).total, entries.length) : entries.length;
  const page = response && typeof response === "object" && "page" in response ? asNumber((response as { page?: unknown }).page, 1) : 1;
  const limit = response && typeof response === "object" && "limit" in response ? asNumber((response as { limit?: unknown }).limit, entries.length || 1) : entries.length || 1;
  const totalPages = response && typeof response === "object" && "totalPages" in response ? asNumber((response as { totalPages?: unknown }).totalPages, 1) : 1;

  return {
    data: entries.map((item) => normalizeAuditLog(item as ApiAuditLog)),
    total,
    page,
    limit,
    totalPages,
  };
}

function firstNumericValue(record: Record<string, unknown>): number {
  for (const value of Object.values(record)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function normalizeSeriesItem(item: unknown, index: number): DashboardSeriesPoint {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const label = asString(
      record.name ?? record.label ?? record.country ?? record.language ?? record.month ?? record.day ?? record.date ?? record.status,
      `Item ${index + 1}`
    );
    const value = asNumber(
      record.value ?? record.count ?? record.total ?? record.amount ?? record.users ?? record.revenue ?? record.xp,
      firstNumericValue(record)
    );
    return { name: label, value, ...Object.fromEntries(Object.entries(record).filter(([, v]) => typeof v === "string" || typeof v === "number")) };
  }

  if (typeof item === "number") {
    return { name: `Item ${index + 1}`, value: item };
  }

  return { name: `Item ${index + 1}`, value: 0 };
}

export function normalizeSeriesResponse(response: unknown): DashboardSeriesPoint[] {
  if (Array.isArray(response)) {
    return response.map((item, index) => normalizeSeriesItem(item, index));
  }

  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data.map((item, index) => normalizeSeriesItem(item, index));
    }

    return Object.entries(record).map(([key, value], index) => {
      if (typeof value === "number") {
        return { name: key, value };
      }

      if (value && typeof value === "object") {
        return normalizeSeriesItem({ name: key, ...(value as Record<string, unknown>) }, index);
      }

      return { name: key, value: asNumber(value, index) };
    });
  }

  return [];
}

export function normalizeGeoPlaces(response: unknown): GeoPlace[] {
  const source =
    Array.isArray(response)
      ? response
      : response && typeof response === "object"
        ? [
            ...(Array.isArray((response as { pois?: unknown[] }).pois) ? (response as { pois: unknown[] }).pois : []),
            ...(Array.isArray((response as { results?: unknown[] }).results) ? (response as { results: unknown[] }).results : []),
            ...(Array.isArray((response as { data?: unknown[] }).data) ? (response as { data: unknown[] }).data : []),
          ]
        : [];

  return source.map((item, index) => {
    const record = item as Record<string, unknown>;
    return {
      id: asString(record.id, `${index}`),
      name: asString(record.name ?? record.title ?? record.display_name, `Place ${index + 1}`),
      type: asString(record.type ?? record.category, "place"),
      lat: asNumber(record.lat ?? record.latitude),
      lng: asNumber(record.lng ?? record.lon ?? record.longitude),
      address: typeof record.address === "string" ? record.address : undefined,
      distance: typeof record.distance === "number" ? record.distance : undefined,
      rating: typeof record.rating === "number" ? record.rating : undefined,
    };
  });
}

export function normalizeEnvironmentResponse(response: unknown): EnvironmentData {
  const record = response && typeof response === "object" ? (response as Record<string, unknown>) : {};
  const overview = record.overview && typeof record.overview === "object" ? (record.overview as Record<string, unknown>) : null;

  return {
    weather: (record.weather as EnvironmentData["weather"]) ?? (overview?.weather as EnvironmentData["weather"]),
    airQuality: (record.airQuality as EnvironmentData["airQuality"]) ?? (overview?.airQuality as EnvironmentData["airQuality"]),
    prayerTimes: (record.prayerTimes as EnvironmentData["prayerTimes"]) ?? (overview?.prayerTimes as EnvironmentData["prayerTimes"]),
    overview,
    location: typeof record.location === "string" ? record.location : typeof overview?.location === "string" ? overview.location : null,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : typeof overview?.updatedAt === "string" ? overview.updatedAt : null,
  };
}
