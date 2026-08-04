"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineViewGrid,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineLocationMarker,
  HiOutlineCloud,
  HiOutlineCash,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineDatabase,
} from "react-icons/hi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_NAME, NAV_ITEMS, ROLE_LABELS } from "@/constants";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <HiOutlineViewGrid className="size-5" />,
  analytics: <HiOutlineChartBar className="size-5" />,
  users: <HiOutlineUsers className="size-5" />,
  roles: <HiOutlineShieldCheck className="size-5" />,
  badges: <HiOutlineBadgeCheck className="size-5" />,
  geo: <HiOutlineLocationMarker className="size-5" />,
  environment: <HiOutlineCloud className="size-5" />,
  payments: <HiOutlineCash className="size-5" />,
  tokenPackages: <HiOutlineCube className="size-5" />,
  tokenWallets: <HiOutlineCreditCard className="size-5" />,
  audit: <HiOutlineClipboardList className="size-5" />,
  settings: <HiOutlineCog className="size-5" />,
  vectorDb: <HiOutlineDatabase className="size-5" />,
};

const NAV_GROUPS: { title: string; items: string[] }[] = [
  { title: "Overview", items: ["dashboard", "analytics"] },
  { title: "Management", items: ["users", "roles", "badges"] },
  { title: "Services", items: ["geo", "environment", "vectorDb"] },
  { title: "Finance", items: ["payments", "tokenPackages", "tokenWallets"] },
  { title: "System", items: ["audit", "settings"] },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/50 bg-sidebar/95 backdrop-blur-xl transition-all duration-300",
        collapsed && !mobile ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
              <span className="text-base font-bold">R</span>
            </div>
            <div className="leading-tight">
              <span className="block font-bold tracking-tight">{APP_NAME}</span>
              <span className="block text-[11px] text-muted-foreground">Control Center</span>
            </div>
          </Link>
        )}
        {onToggle && !mobile && (
          <Button variant="ghost" size="icon-sm" onClick={onToggle} className="ml-auto">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items
            .map((icon) => visibleItems.find((item) => item.icon === icon))
            .filter((item): item is (typeof NAV_ITEMS)[number] => !!item);
          if (!items.length) return null;

          return (
            <div key={group.title} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </p>
              )}
              <nav className="space-y-0.5" aria-label={group.title}>
                {items.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <span className="shrink-0">{iconMap[item.icon]}</span>
                      {!collapsed && item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/50 p-3">
        {user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5",
              collapsed && "justify-center px-2"
            )}
          >
            <Avatar className="size-8 shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
            collapsed && "justify-center"
          )}
        >
          <HiOutlineLogout className="size-5 shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
