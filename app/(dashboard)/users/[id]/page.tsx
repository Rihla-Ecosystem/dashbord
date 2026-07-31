"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Globe, Calendar, Zap, Shield, Trash2, RotateCcw, Ban, BadgeCheck, Power, ZapOff } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { RoleBadge, StatusBadge } from "@/components/shared/RoleBadge";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useUserBadges } from "@/hooks/useUser";
import { formatDate, getInitials } from "@/utils";
import { use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import { toast } from "sonner";
import { getErrorMessage, formatXp } from "@/utils";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";
import { ChartCard } from "@/components/shared/ChartCard";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: user, isLoading, error, refetch } = useUser(id);
  const { data: badges } = useUserBadges(id);
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardUserStats(id),
    queryFn: () => dashboardApi.getUserStatistics(id),
    enabled: !!id,
  });
  const activityQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardActivity({ userId: id }),
    queryFn: () => dashboardApi.getAdminTimeline({ limit: 20 }),
    enabled: !!id,
  });

  const invalidate = () => {
    void refetch();
  };

  const banMutation = useMutation({
    mutationFn: (banned: boolean) => dashboardApi.banUser(id, banned),
    onSuccess: (_, banned) => {
      toast.success(banned ? "User banned" : "User unbanned");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const activateMutation = useMutation({
    mutationFn: () => dashboardApi.activateUser(id),
    onSuccess: () => {
      toast.success("User activated");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => dashboardApi.deactivateUser(id),
    onSuccess: () => {
      toast.success("User deactivated");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const verifyMutation = useMutation({
    mutationFn: () => dashboardApi.verifyUserEmail(id),
    onSuccess: () => {
      toast.success("Email verified");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resetXpMutation = useMutation({
    mutationFn: () => dashboardApi.resetUserXp(id),
    onSuccess: () => {
      toast.success("XP reset");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resetWalletMutation = useMutation({
    mutationFn: () => dashboardApi.resetUserWallet(id),
    onSuccess: () => {
      toast.success("Wallet reset");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const restoreMutation = useMutation({
    mutationFn: () => dashboardApi.restoreUser(id),
    onSuccess: () => {
      toast.success("User restored");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => dashboardApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <PageLoader />;
  if (error || !user) return <ErrorState onRetry={() => refetch()} />;

  const badgeList = Array.isArray(badges) ? badges : (badges as { data?: unknown[] })?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" render={<Link href="/users" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader title={user.name} description={user.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard title="Profile" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar className="size-24 border-4 border-background shadow-lg">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.verified ? "verified" : "pending"} />
              {user.banned && <StatusBadge status="banned" />}
            </div>
            {user.bio && (
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            )}
          </div>
        </DashboardCard>

        <div className="space-y-6 lg:col-span-2">
          <DashboardCard title="Actions" description="Administrative controls for this account">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Button variant="outline" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}><BadgeCheck className="size-4" /> Verify Email</Button>
              <Button variant="outline" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}><Power className="size-4" /> Activate</Button>
              <Button variant="outline" onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}><Ban className="size-4" /> Deactivate</Button>
              <Button variant="outline" onClick={() => banMutation.mutate(!user.banned)} disabled={banMutation.isPending}><Shield className="size-4" /> {user.banned ? "Unban" : "Ban"}</Button>
              <Button variant="outline" onClick={() => resetXpMutation.mutate()} disabled={resetXpMutation.isPending}><ZapOff className="size-4" /> Reset XP</Button>
              <Button variant="outline" onClick={() => resetWalletMutation.mutate()} disabled={resetWalletMutation.isPending}><RotateCcw className="size-4" /> Reset Wallet</Button>
              <Button variant="outline" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}><RotateCcw className="size-4" /> Restore</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}><Trash2 className="size-4" /> Delete</Button>
            </div>
          </DashboardCard>

          <DashboardCard title="Travel Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={<Globe className="size-4" />} label="Nationality" value={user.nationality ?? "—"} />
              <InfoItem icon={<MapPin className="size-4" />} label="Travel Style" value={user.travelStyle ?? "—"} />
              <InfoItem label="Budget" value={user.budget ?? "—"} />
              <InfoItem label="Accommodation" value={user.accommodation ?? "—"} />
              <InfoItem icon={<Calendar className="size-4" />} label="Arrival" value={user.arrival ? formatDate(user.arrival) : "—"} />
              <InfoItem icon={<Calendar className="size-4" />} label="Departure" value={user.departure ? formatDate(user.departure) : "—"} />
            </div>
          </DashboardCard>

          <DashboardCard title="Gamification">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <Zap className="mx-auto mb-2 size-5 text-amber-500" />
                <p className="text-2xl font-bold">{formatXp(user.xp)}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">{user.level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">{user.role}</p>
                <p className="text-xs text-muted-foreground">Role</p>
              </div>
            </div>
          </DashboardCard>

          <ChartCard title="User Statistics" description="Wallet, XP, badges and journey summary" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries((statsQuery.data as Record<string, unknown>) ?? {}).filter(([, value]) => typeof value === "number").map(([name, value]) => ({ name, value: Number(value) }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <DashboardCard title="Timeline" description="Recent admin and user activity">
            <ActivityTimeline logs={activityQuery.data?.data ?? []} />
          </DashboardCard>

          {user.languages && user.languages.length > 0 && (
            <DashboardCard title="Languages">
              <div className="flex flex-wrap gap-2">
                {user.languages.map((lang) => (
                  <span key={lang} className="rounded-full bg-muted px-3 py-1 text-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </DashboardCard>
          )}

          <DashboardCard title="Badges">
            {badgeList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No badges earned yet</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(badgeList as Array<{ id: string; name: string; description?: string }>).map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                      🏅
                    </div>
                    <div>
                      <p className="font-medium">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
