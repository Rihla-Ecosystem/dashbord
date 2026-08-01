"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/features/auth/auth-context";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-all duration-300",
          "lg:ml-[280px]",
          sidebarCollapsed && "lg:ml-[72px]"
        )}
      >
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <div className="px-4 pt-4 md:hidden">
          <Breadcrumbs />
        </div>
        <main className="flex-1 space-y-6 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
