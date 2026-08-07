export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";
export type NotificationCategory =
  | "SAFETY"
  | "SECURITY"
  | "WEATHER"
  | "TRAFFIC"
  | "TOURIST"
  | "HISTORICAL"
  | "EMERGENCY"
  | "RESTRICTED_AREA"
  | "PHOTOGRAPHY"
  | "RECOMMENDATION"
  | "SYSTEM";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type NotificationSource = "SYSTEM" | "AI" | "ADMIN" | "CONTEXT" | "EMERGENCY";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminNotificationUser {
  id: string;
  displayName: string | null;
  email: string;
}

export interface AdminNotificationListItem {
  id: string;
  userId: string;
  historyId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  source: NotificationSource;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  cooldownKey: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  user?: AdminNotificationUser;
}

export interface AdminNotificationsResult {
  notifications: AdminNotificationListItem[];
  pagination: Pagination;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplatesResult {
  templates: NotificationTemplate[];
  pagination: Pagination;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  source: string;
  status: string;
  recipients: number;
  delivered: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  audience?: unknown;
}

export interface NotificationHistoryResult {
  history: NotificationHistoryItem[];
  pagination: Pagination;
}

export interface NotificationLogItem {
  id: string;
  userId: string | null;
  notificationId: string | null;
  historyId: string | null;
  event: string;
  detail: string | null;
  createdAt: string;
  user?: AdminNotificationUser;
}

export interface NotificationLogsResult {
  logs: NotificationDeliveryLogItem[];
  pagination: Pagination;
}

export interface NotificationDeliveryLogItem {
  id: string;
  userId: string | null;
  notificationId: string | null;
  historyId: string | null;
  event: string;
  detail: string | null;
  createdAt: string;
  user?: AdminNotificationUser;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalUnread: number;
  totalRead: number;
  totalUsers: number;
  readRate: number;
  byCategory: { category: NotificationCategory; count: number }[];
  today: { totalSent: number; totalRead: number } | null;
}

export interface ReadUnreadStats {
  read: number;
  unread: number;
  total: number;
  readPercentage: number;
}

export interface ContextReportListItem {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  areaName: string | null;
  summary: string | null;
  createdAt: string;
  user?: AdminNotificationUser;
}

export interface ContextReportsResult {
  reports: ContextReportListItem[];
  pagination: Pagination;
}

export interface ContextReportNearbyItem {
  name: string;
  nameEn?: string | null;
  nameAr?: string | null;
  categories?: string[];
  distanceMeters?: number;
  lat?: number;
  lng?: number;
  details?: Record<string, unknown> | null;
}

export interface ContextReportAiSummary {
  executiveSummary: string;
  currentSituation: string;
  safetyAssessment: string;
  riskAnalysis: string;
  personalizedRecommendations: string[];
  touristTips: string[];
  historicalSummary: string;
  interestingFacts: string[];
  thingsToAvoid: string[];
  recommendedActions: string[];
  emergencyInstructions: string[];
}

export interface ContextReportData {
  areaInformation?: {
    area?: string | null;
    governorate?: string | null;
    zone?: string | null;
    atSite?: string | null;
    nearbyAttractionsCount?: number;
    nearbyServicesCount?: number;
    restrictedAreas?: string[];
    photographyRestrictions?: string[];
  } | null;
  aiSummary?: ContextReportAiSummary | null;
  safetyScore?: number | null;
  riskLevel?: string | null;
  historicalInformation?: string | null;
  touristTips?: string[];
  recommendations?: string[];
  thingsToAvoid?: string[];
  nearbyAttractions?: ContextReportNearbyItem[];
  nearbyRestaurants?: ContextReportNearbyItem[];
  nearbyHotels?: ContextReportNearbyItem[];
  nearbyHospitals?: ContextReportNearbyItem[];
  nearbyPoliceStations?: ContextReportNearbyItem[];
  nearbyTransportation?: ContextReportNearbyItem[];
  emergencyContacts?: { type: string; name: string; phone: string }[];
  generatedAt?: string | null;
}

export interface ContextReportDetail {
  id: string;
  userId: string;
  lat: number | null;
  lng: number | null;
  areaName: string | null;
  context: unknown;
  report: ContextReportData | null;
  notifications: { id: string; title: string; priority: string }[];
  summary: string | null;
  createdAt: string;
  user?: AdminNotificationUser;
}

export interface NotificationCategories {
  types: string[];
  categories: string[];
  priorities: string[];
  sources: string[];
  statuses: string[];
}

export interface NotificationSettings {
  cooldownRules: Record<string, string>;
  movementThresholdKm: number;
  realtimeEnabled: boolean;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  audience?: {
    all?: boolean;
    userIds?: string[];
    roles?: string[];
    governorates?: string[];
    cities?: string[];
    polygons?: { lat: number; lng: number }[][];
    radius?: { lat: number; lng: number; km: number };
  };
  schedule?: { sendAt?: string };
  templateId?: string;
  data?: Record<string, unknown>;
}

export interface CreateNotificationResult {
  notification?: NotificationHistoryItem;
  recipients: number;
  delivered: number;
  scheduled?: boolean;
  historyId?: string;
}

export interface CreateTemplateInput {
  code: string;
  name: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  priority?: string;
  variables?: Record<string, unknown>;
  data?: Record<string, unknown>;
}