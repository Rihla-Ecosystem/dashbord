"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Sparkles, Trophy, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { StatCard } from "@/components/shared/StatCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QUERY_KEYS } from "@/constants";
import { dashboardApi } from "@/services/api";
import { formatDateTime, formatNumber, getInitials } from "@/utils";

interface BadgeUnlock {
  id: string;
  awardedAt?: string;
  user: { id: string; name?: string; displayName?: string; email?: string; avatar?: string; avatarUrl?: string };
  badge: { id: number | string; name?: string; description?: string; icon?: string; iconUrl?: string };
}

const userName = (u: BadgeUnlock["user"]) => u.displayName ?? u.name ?? u.email ?? "Unknown user";
const userAvatar = (u: BadgeUnlock["user"]) => u.avatarUrl ?? u.avatar;
const badgeIcon = (b: BadgeUnlock["badge"]) => b.iconUrl ?? b.icon ?? "🏅";

export default function BadgesPage() {
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => dashboardApi.getStatistics(),
  });
  const unlocksQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardActivity({ type: "badge-unlocks" }),
    queryFn: () => dashboardApi.getRecentBadgeUnlocks(),
  });

  const isLoading = statsQuery.isLoading || unlocksQuery.isLoading;
  const error = statsQuery.error || unlocksQuery.error;

  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const stats = (statsQuery.data ?? {}) as Record<string, unknown>;
  const unlocks = (unlocksQuery.data ?? []) as BadgeUnlock[];
  const totalAwards = Number(stats.totalBadges ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Badges" description="Achievement badges and recent user unlocks" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Badges Awarded"
          value={formatNumber(totalAwards)}
          icon={<Award className="size-5" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Badge Types (Recent)"
          value={formatNumber(new Set(unlocks.map((u) => String(u.badge?.id))).size)}
          icon={<Trophy className="size-5" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="Recent Unlocks"
          value={formatNumber(unlocks.length)}
          icon={<Sparkles className="size-5" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Latest Award"
          value={unlocks[0]?.awardedAt ? formatDateTime(unlocks[0].awardedAt) : "—"}
          icon={<Clock className="size-5" />}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
      </div>

      <DashboardCard title="Recent Badge Unlocks">
        {isLoading ? (
          <SkeletonTable rows={5} columns={3} />
        ) : unlocks.length === 0 ? (
          <EmptyState
            title="No badge unlocks yet"
            description="Badges are awarded automatically as users reach achievements"
          />
        ) : (
          <div className="space-y-3">
            {unlocks.map((unlock) => (
              <div
                key={unlock.id}
                className="flex items-center gap-4 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-lg">
                  {badgeIcon(unlock.badge)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{unlock.badge?.name ?? "Badge"}</p>
                    <Award className="size-3.5 text-amber-500" />
                  </div>
                  {unlock.badge?.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {unlock.badge.description}
                    </p>
                  )}
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <Avatar className="size-8">
                    {userAvatar(unlock.user) && (
                      <AvatarImage src={userAvatar(unlock.user)} alt={userName(unlock.user)} />
                    )}
                    <AvatarFallback>{getInitials(userName(unlock.user))}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{userName(unlock.user)}</p>
                    <p className="text-xs text-muted-foreground">
                      {unlock.awardedAt ? formatDateTime(unlock.awardedAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
