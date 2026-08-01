export type UserRole = "ADMIN" | "MODERATOR" | "USER";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiUserRole {
  name?: string;
}

export interface ApiUser {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  bio?: string | null;
  gender?: Gender | "MALE" | "FEMALE" | null;
  nationality?: string | null;
  language?: string[];
  languages?: string[];
  budgetLevel?: string | null;
  budget?: string | null;
  arrivalDate?: string | null;
  arrival?: string | null;
  departureDate?: string | null;
  departure?: string | null;
  travelStyle?: string | null;
  interests?: string[] | null;
  accommodationType?: string | null;
  accommodation?: string | null;
  roleId?: number | null;
  role?: ApiUserRole | UserRole | string | null;
  isEmailVerified?: boolean;
  verified?: boolean;
  banned?: boolean;
  xp?: number;
  level?: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ApiLoginResponse {
  accessToken: string;
  user: ApiUser;
}

export interface ApiRegisterResponse {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ApiBadge {
  id: number;
  name: string;
  description: string;
  iconUrl?: string | null;
  criteriaType?: string;
  criteriaValue?: number | null;
}

export interface ApiAuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: {
    displayName?: string;
    email?: string;
  };
  target?: {
    displayName?: string;
    email?: string;
  };
}

export interface DashboardSeriesPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardStatisticsResponse {
  [key: string]: unknown;
}

export interface DashboardUserStatisticsResponse {
  [key: string]: unknown;
}

export interface DashboardUserFilters extends UsersQueryParams {
  banned?: boolean;
  deleted?: boolean;
  from?: string;
  to?: string;
}

export interface GeoSearchRequest {
  q: string;
  lat?: number;
  lon?: number;
  radius?: number;
  categories?: string;
}

export interface GeoPoiRequest {
  lat: number;
  lon: number;
  radius?: number;
  categories?: string;
}

export interface EnvRequest {
  lat: number;
  lon: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: UserRole;
  bio?: string | null;
  nationality?: string | null;
  languages?: string[];
  travelStyle?: string | null;
  budget?: string | null;
  accommodation?: string | null;
  arrival?: string | null;
  departure?: string | null;
  gender?: Gender | null;
  xp: number;
  level: number;
  verified: boolean;
  banned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  earnedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: UserRole;
  gender?: Gender;
  nationality?: string;
  verified?: boolean;
  minXp?: number;
  maxXp?: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string | null;
  nationality?: string | null;
  languages?: string[];
  travelStyle?: string | null;
  budget?: string | null;
  accommodation?: string | null;
  arrival?: string | null;
  departure?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
}

export interface GeoSearchParams {
  q: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
}

export interface GeoPlace {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  distance?: number;
  rating?: number;
}

export interface GeoPoiParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon?: string;
  windSpeed: number;
}

export interface AirQualityData {
  aqi: number;
  level: string;
  pm25: number;
  pm10: number;
}

export interface PrayerTime {
  name: string;
  time: string;
}

export interface EnvironmentData {
  weather?: WeatherData | null;
  airQuality?: AirQualityData | null;
  prayerTimes?: PrayerTime[] | null;
  overview?: Record<string, unknown> | null;
  location?: string | null;
  updatedAt?: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  admins: number;
  moderators: number;
  verifiedUsers: number;
  averageXp: number;
  activeSessions: number;
  trends?: {
    totalUsers?: number;
    admins?: number;
    moderators?: number;
    verifiedUsers?: number;
    averageXp?: number;
    activeSessions?: number;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ApiErrorDetail {
  path?: string | string[];
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
  error?: string;
  details?: ApiErrorDetail[];
}
