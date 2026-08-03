"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { useAuth } from "@/features/auth/auth-context";

import { MoreHorizontal, Plus, Eye, Pencil, Ban, Trash2, Shield, Download, FileSpreadsheet, FileText, Coins } from "lucide-react";

import { Users, BadgeCheck } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUsers, useUserMutations } from "@/hooks/useUsers";
import type { User, UserRole, Gender } from "@/types";
import { formatDate, formatXp, getInitials, formatNumber, isAdmin } from "@/utils";
import { GENDER_OPTIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils";

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
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: User; role: UserRole } | null>(null);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<{
    email: string;
    password: string;
    displayName: string;
    gender: "MALE" | "FEMALE";
    nationality: string;
    language: string[];
    budgetLevel: string;
    arrivalDate: string;
    departureDate: string;
    travelStyle: string;
    interests: string;
    accommodationType: string;
    roleId: number;
  }>({
    email: "",
    password: "",
    displayName: "",
    gender: "MALE",
    nationality: "",
    language: [],
    budgetLevel: "",
    arrivalDate: "",
    departureDate: "",
    travelStyle: "",
    interests: "",
    accommodationType: "",
    roleId: 1,
  });

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

  const { createUser, banUser, updateRole, deleteUser } = useUserMutations();


  const handleExport = async (format: "csv" | "excel") => {
    setExporting(format);
    try {
      const { blob, filename } = await dashboardApi.exportUsers(
        {
          search: debouncedSearch || undefined,
          role: role || undefined,
          gender: gender || undefined,
          verified: verified === "" ? undefined : verified === "true",
          banned: banned === "" ? undefined : banned === "true",
          deleted: deleted === "" ? undefined : deleted === "true",
          from: dateFrom || undefined,
          to: dateTo || undefined,
          sortBy,
          sortOrder: sortBy ? sortOrder : undefined,
        },
        format
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${format === "excel" ? "Excel" : "CSV"} file`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(null);
    }
  };

  const [roles , setRoles] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData : { id: number; name: string }[]  = await dashboardApi.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);
  

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
      <PageHeader title="Users" description="Manage platform users and permissions">
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger render={

              <Button variant="default" className="rounded-xl">
                <Plus className="size-4" /> Create User
              </Button>
            }>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>Add a new user to the platform</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="create-email">Email</label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-password">Password</label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-name">Display Name</label>
                  <Input
                    id="create-name"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="User name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="create-gender">Gender</label>
                    <Select
                      value={createForm.gender}
                      onValueChange={(v) => setCreateForm((prev) => ({ ...prev, gender: v as "MALE" | "FEMALE" }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="create-nationality">Nationality</label>
                    <Input
                      id="create-nationality"
                      value={createForm.nationality}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, nationality: e.target.value }))}
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-budget">Budget Level</label>
                  <Input
                    id="create-budget"
                    value={createForm.budgetLevel}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, budgetLevel: e.target.value }))}
                    placeholder="e.g. budget, mid-range, luxury"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-travel">Travel Style</label>
                  <Input
                    id="create-travel"
                    value={createForm.travelStyle}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, travelStyle: e.target.value }))}
                    placeholder="e.g. solo, group, adventure"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-accommodation">Accommodation Type</label>
                  <Input
                    id="create-accommodation"
                    value={createForm.accommodationType}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, accommodationType: e.target.value }))}
                    placeholder="e.g. hotel, hostel, Airbnb"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-role">Role</label>
                  <Select
                    value={String(createForm.roleId)}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, roleId: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">User</SelectItem>
                      <SelectItem value="2">Moderator</SelectItem>
                      <SelectItem value="3">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!createForm.email || !createForm.password || !createForm.displayName || !createForm.nationality) {
                      return;
                    }
                    await createUser.mutateAsync({
                      email: createForm.email,
                      password: createForm.password,
                      displayName: createForm.displayName,
                      gender: createForm.gender,
                      nationality: createForm.nationality,
                      language: createForm.language,
                      budgetLevel: createForm.budgetLevel || undefined,
                      arrivalDate: createForm.arrivalDate || undefined,
                      departureDate: createForm.departureDate || undefined,
                      travelStyle: createForm.travelStyle || undefined,
                      interests: createForm.interests ? createForm.interests.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
                      accommodationType: createForm.accommodationType || undefined,
                      roleId: createForm.roleId,
                    });
                    setCreateForm({
                      email: "",
                      password: "",
                      displayName: "",
                      gender: "MALE",
                      nationality: "",
                      language: [],
                      budgetLevel: "",
                      arrivalDate: "",
                      departureDate: "",
                      travelStyle: "",
                      interests: "",
                      accommodationType: "",
                      roleId: 1,
                    });
                    setShowCreateDialog(false);
                  }}
                  disabled={createUser.isPending}
                >
                  {createUser.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="rounded-xl" disabled={!!exporting}>
                  {exporting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Exporting...
                    </span>
                  ) : (
                    <>
                      <Download className="size-4" /> Export
                    </>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="size-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="size-4" /> Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

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
            {
              roles.map((r) => (
                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
              ))
            }
         
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