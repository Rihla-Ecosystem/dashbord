import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { UserRole } from "@/types";

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM d, yyyy HH:mm");
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getInitials(name: string = "!"): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return String(xp);
}

function isUserRoleName(name: string): name is UserRole {
  return name === "ADMIN" || name === "MODERATOR" || name === "USER";
}

export function normalizeRoleName(role: unknown): UserRole | undefined {
  if (typeof role === "string") {
    const upper = role.toUpperCase();
    return isUserRoleName(upper) ? upper : undefined;
  }
  if (typeof role === "object" && role !== null && "name" in role) {
    const name = role.name;
    if (typeof name === "string") {
      const upper = name.toUpperCase();
      return isUserRoleName(upper) ? upper : undefined;
    }
  }
  return undefined;
}

export function hasRole(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function isAdmin(role?: UserRole): boolean {
  return role === "ADMIN";
}

export function isModeratorOrAbove(role?: UserRole): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred";
}

export function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function cnRoleColor(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    case "MODERATOR":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}
