"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Ban, Trash2, Shield, Coins, Users, BadgeCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { RoleBadge, StatusBadge } from "@/components/shared/RoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers, useUserMutations } from "@/hooks/useUsers";
import type { User, UserRole, Gender } from "@/types";
import { formatDate, formatXp, getInitials, formatNumber } from "@/utils";
import { GENDER_OPTIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";

function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "MODERATOR" || value === "USER";
}

function isGender(value: string): value is Gender {
  return value === "MALE" || value === "FEMALE" || value === "OTHER" || value === "PREFER_NOT_TO_SAY";
}

export default function UsersPage() {

  const { isAdmin } = useAuth();

  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [role, setRole] = useState<UserRole | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [verified, setVerified] = useState<string>("");
  const [banned, setBanned] = useState<string>("");
  const [deleted, setDeleted] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: User; role: UserRole } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      searchTimerRef.current = null;
    }, 300);
  }, []);

  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setPage(1);
  }

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading, error, refetch } = useUsers({
    page,
    limit,
    search: debouncedSearch || undefined,
    role: role || undefined,
    gender: gender || undefined,
    verified: verified === "" ? undefined : verified === "true",
    sortBy,
    sortOrder: sortBy ? sortOrder : undefined,
    banned: banned === "" ? undefined : banned === "true",
    deleted: deleted === "" ? undefined : deleted === "true",
    from: dateFrom || undefined,
    to: dateTo || undefined,
  });

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => dashboardApi.getStatistics(),
  });

  const { banUser, updateRole, deleteUser } = useUserMutations();

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {row.original.avatar && (
                <AvatarImage src={row.original.avatar} alt={row.original.name} />
              )}
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "level",
        header: "Level",
      },
      {
        accessorKey: "xp",
        header: "XP",
        cell: ({ row }) => formatXp(row.original.xp),
      },
      {
        accessorKey: "verified",
        header: "Verified",
        cell: ({ row }) => (
          <StatusBadge status={row.original.verified ? "verified" : "pending"} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem render={<Link href={`/users/${row.original.id}`} />}>
                <Eye className="size-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/users/${row.original.id}?edit=true`} />}>
                <Pencil className="size-4" /> Edit
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem render={<Link href={`/token-wallets/${row.original.id}`} />}>
                  <Coins className="size-4" /> Manage Tokens
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleTarget({ user: row.original, role: "MODERATOR" })}>
                <Shield className="size-4" /> Change Role
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setBanTarget(row.original)}
              >
                <Ban className="size-4" /> {row.original.banned ? "Unban" : "Ban"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isAdmin]
  );

  const hasFilters = !!(role || gender || verified || banned || deleted || dateFrom || dateTo);

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage platform users and permissions" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={formatXp(Number((statsQuery.data as Record<string, unknown> | undefined)?.totalUsers ?? data?.total ?? 0))}
          icon={<Users className="size-5" />}
          trend={Number((statsQuery.data as Record<string, unknown> | undefined)?.newUsersToday ?? 0)}
          trendLabel="new today"
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="Verified"
          value={formatNumber(Number((statsQuery.data as Record<string, unknown> | undefined)?.verifiedUsers ?? 0))}
          icon={<BadgeCheck className="size-5" />}
          trend={Number((statsQuery.data as Record<string, unknown> | undefined)?.unverifiedUsers ?? 0)}
          trendLabel="unverified"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Banned"
          value={formatNumber(Number((statsQuery.data as Record<string, unknown> | undefined)?.bannedUsers ?? 0))}
          icon={<Ban className="size-5" />}
          trend={0}
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
        />
        <StatCard
          title="Deleted"
          value={formatNumber(Number((statsQuery.data as Record<string, unknown> | undefined)?.deletedUsers ?? 0))}
          icon={<Trash2 className="size-5" />}
          trend={0}
          gradient="bg-gradient-to-br from-slate-500 to-slate-700"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            handleSearchChange(v);
          }}
          placeholder="Search by name or email..."
          className="flex-1"
        />
      </div>

      <FilterBar
        hasActiveFilters={hasFilters}
        onClear={() => {
          setRole("");
          setGender("");
          setVerified("");
          setBanned("");
          setDeleted("");
          setDateFrom("");
          setDateTo("");
          setPage(1);
        }}
      >
        <Select
          value={role || "all"}
          onValueChange={(value) => {
            if (value === null) return;
            if (value === "all") {
              setRole("");
            } else if (isUserRole(value)) {
              setRole(value);
            }
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={gender || "all"}
          onValueChange={(value) => {
            if (value === null) return;
            if (value === "all") {
              setGender("");
            } else if (isGender(value)) {
              setGender(value);
            }
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={verified || "all"}
          onValueChange={(value) => {
            if (value === null) return;
            setVerified(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue placeholder="Verified" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={banned || "all"}
          onValueChange={(value) => {
            if (value === null) return;
            setBanned(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue placeholder="Banned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Banned</SelectItem>
            <SelectItem value="false">Active</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={deleted || "all"}
          onValueChange={(value) => {
            if (value === null) return;
            setDeleted(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue placeholder="Deleted" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Deleted</SelectItem>
            <SelectItem value="false">Active</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 w-38 rounded-xl" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 w-38 rounded-xl" />
      </FilterBar>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        sorting={sorting}
        onSortingChange={setSorting}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters"
      />

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      )}

      <ConfirmDialog
        open={!!banTarget}
        onOpenChange={() => setBanTarget(null)}
        title={banTarget?.banned ? "Unban User" : "Ban User"}
        description={`Are you sure you want to ${banTarget?.banned ? "unban" : "ban"} ${banTarget?.name}?`}
        variant="destructive"
        confirmLabel={banTarget?.banned ? "Unban" : "Ban"}
        isLoading={banUser.isPending}
        onConfirm={() => {
          if (banTarget) {
            banUser.mutate({ id: banTarget.id, banned: !banTarget.banned }, {
              onSuccess: () => setBanTarget(null),
            });
          }
        }}
      />

      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={() => setRoleTarget(null)}
        title="Change User Role"
        description={`Change ${roleTarget?.user.name}'s role to Moderator?`}
        confirmLabel="Change Role"
        isLoading={updateRole.isPending}
        onConfirm={() => {
          if (roleTarget) {
            updateRole.mutate(
              { id: roleTarget.user.id, role: roleTarget.role },
              { onSuccess: () => setRoleTarget(null) }
            );
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteUser?.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteUser?.mutate(
              { id: deleteTarget.id },
              { onSuccess: () => setDeleteTarget(null) }
            );
          }
        }}
      />
    </div>
  );
}