"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MapPin, Globe, Calendar, Zap, Shield, Trash2, RotateCcw, Ban, BadgeCheck, Power, ZapOff, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonCard, Skeleton } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { RoleBadge, StatusBadge } from "@/components/shared/RoleBadge";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useUser, useUserBadges } from "@/hooks/useUser";
import { formatDate, getInitials } from "@/utils";
import { use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [confirmAction, setConfirmAction] = useState<"delete" | "ban" | "unban" | null>(null);
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

  const updateUser = useMutation({
    mutationFn: (data: Record<string, unknown>) => dashboardApi.updateUser(id, data),
    onSuccess: () => {
      toast.success("User updated");
      invalidate();
      setShowEditDialog(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.name ?? "",
    bio: user?.bio ?? "",
    nationality: user?.nationality ?? "",
    language: (user?.languages ?? []).join(", "),
    budgetLevel: user?.budget ?? "",
    travelStyle: user?.travelStyle ?? "",
    accommodation: user?.accommodation ?? "",
    arrival: user?.arrival ?? "",
    departure: user?.departure ?? "",
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  if (error || !user) return <ErrorState onRetry={() => refetch()} />;


  const badgeList = Array.isArray(badges) ? badges : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/users" />}>
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
              <Button variant="outline" onClick={() => setShowEditDialog(true)} disabled={updateUser.isPending}><Pencil className="size-4" /> Edit Profile</Button>
              <Button variant="outline" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}><BadgeCheck className="size-4" /> Verify Email</Button>
              <Button variant="outline" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}><Power className="size-4" /> Activate</Button>
              <Button variant="outline" onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}><Ban className="size-4" /> Deactivate</Button>
              <Button variant="outline" onClick={() => setConfirmAction(user.banned ? "unban" : "ban")} disabled={banMutation.isPending}><Shield className="size-4" /> {user.banned ? "Unban" : "Ban"}</Button>
              <Button variant="outline" onClick={() => resetXpMutation.mutate()} disabled={resetXpMutation.isPending}><ZapOff className="size-4" /> Reset XP</Button>
              <Button variant="outline" onClick={() => resetWalletMutation.mutate()} disabled={resetWalletMutation.isPending}><RotateCcw className="size-4" /> Reset Wallet</Button>
              <Button variant="outline" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}><RotateCcw className="size-4" /> Restore</Button>
              <Button variant="destructive" onClick={() => setConfirmAction("delete")} disabled={deleteMutation.isPending}><Trash2 className="size-4" /> Delete</Button>
            </div>
          </DashboardCard>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ">
              <DialogHeader>
                <DialogTitle>Edit User Profile</DialogTitle>
                <DialogDescription>Update user profile information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="edit-name">Display Name</label>
                  <Input
                    id="edit-name"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-bio">Bio</label>
                  <Input
                    id="edit-bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-nationality">Nationality</label>
                  <Input
                    id="edit-nationality"
                    value={editForm.nationality}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, nationality: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-languages">Languages (comma separated)</label>
                  <Input
                    id="edit-languages"
                    value={editForm.language}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, language: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-budget">Budget Level</label>
                  <Input
                    id="edit-budget"
                    value={editForm.budgetLevel}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, budgetLevel: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-travel">Travel Style</label>
                  <Input
                    id="edit-travel"
                    value={editForm.travelStyle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, travelStyle: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="edit-accommodation">Accommodation Type</label>
                  <Input
                    id="edit-accommodation"
                    value={editForm.accommodation}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, accommodation: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-arrival">Arrival Date</label>
                    <Input
                      id="edit-arrival"
                      type="date"
                      value={editForm.arrival}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, arrival: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-departure">Departure Date</label>
                    <Input
                      id="edit-departure"
                      type="date"
                      value={editForm.departure}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, departure: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    await updateUser.mutateAsync({ id, data: {
                      displayName: editForm.displayName || undefined,
                      bio: editForm.bio || undefined,
                      nationality: editForm.nationality || undefined,
                      language: editForm.language ? editForm.language.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                      budgetLevel: editForm.budgetLevel || undefined,
                      travelStyle: editForm.travelStyle || undefined,
                      accommodationType: editForm.accommodation || undefined,
                      arrivalDate: editForm.arrival || undefined,
                      departureDate: editForm.departure || undefined,
                    } });
                    setShowEditDialog(false);
                  }}
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                {badgeList.map((badge) => (
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

      <ConfirmDialog
        open={confirmAction === "delete"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Delete User"
        description={`Permanently delete ${user.name}? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete User"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => setConfirmAction(null),
          });
        }}
      />

      <ConfirmDialog
        open={confirmAction === "ban" || confirmAction === "unban"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === "unban" ? "Unban User" : "Ban User"}
        description={`Are you sure you want to ${confirmAction === "unban" ? "unban" : "ban"} ${user.name}?`}
        variant="destructive"
        confirmLabel={confirmAction === "unban" ? "Unban" : "Ban"}
        isLoading={banMutation.isPending}
        onConfirm={() => {
          banMutation.mutate(confirmAction === "unban" ? false : true, {
            onSuccess: () => setConfirmAction(null),
          });
        }}
      />
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
