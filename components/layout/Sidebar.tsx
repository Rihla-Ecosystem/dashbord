"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar as FlowbiteSidebar, SidebarItem, SidebarItemGroup, SidebarItems, SidebarLogo } from "flowbite-react";
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineLocationMarker,
  HiOutlineCloud,
  HiOutlineCash,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineLogout,
} from "react-icons/hi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV_ITEMS } from "@/constants";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <HiOutlineViewGrid className="size-5" />,
  users: <HiOutlineUsers className="size-5" />,
  roles: <HiOutlineShieldCheck className="size-5" />,
  badges: <HiOutlineBadgeCheck className="size-5" />,
  geo: <HiOutlineLocationMarker className="size-5" />,
  environment: <HiOutlineCloud className="size-5" />,
  payments: <HiOutlineCash className="size-5" />,
  tokenPackages: <HiOutlineCube className="size-5" />,
  audit: <HiOutlineClipboardList className="size-5" />,
  settings: <HiOutlineCog className="size-5" />,
};

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

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/50 bg-sidebar/95 backdrop-blur-xl transition-all duration-300",
        collapsed && !mobile ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white">
              <span className="text-sm font-bold">R</span>
            </div>
            <span className="font-bold tracking-tight">{APP_NAME}</span>
          </Link>
        )}
        {onToggle && !mobile && (
          <Button variant="ghost" size="icon-sm" onClick={onToggle} className="ml-auto">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <FlowbiteSidebar
          aria-label="Admin sidebar"
          className="w-full bg-transparent [&>div]:bg-transparent"
        >
          <SidebarItems>
            <SidebarItemGroup>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <SidebarItem
                    key={item.href}
                    as={Link}
                    href={item.href}
                    onClick={onNavigate}
                    icon={() => iconMap[item.icon]}
                    className={cn(
                      "mx-2 rounded-xl transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {!collapsed && item.label}
                  </SidebarItem>
                );
              })}
            </SidebarItemGroup>
          </SidebarItems>
        </FlowbiteSidebar>
      </div>

      <div className="border-t border-border/50 p-4">
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
        {!collapsed && user && (
          <p className="mt-3 truncate px-3 text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
    </aside>
  );
}
