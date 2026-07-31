"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Ban, Trash2, Shield, Coins } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { RoleBadge, StatusBadge } from "@/components/shared/RoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDate, formatXp, getInitials } from "@/utils";
import { GENDER_OPTIONS, DEFAULT_PAGE_SIZE } from "@/constants";

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [verified, setVerified] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: User; role: UserRole } | null>(null);

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
  });

  const { banUser, updateRole } = useUserMutations();

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
              {isAdmin && <DropdownMenuItem render={<Link href={`/token-wallets/${row.original.id}`} />}>
                <Coins className="size-4" /> Manage Tokens
              </DropdownMenuItem>}
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
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isAdmin]
  );

  const hasFilters = !!(role || gender || verified);

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage platform users and permissions" />

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
          setPage(1);
        }}
      >
        <Select value={role || "all"} onValueChange={(v) => { setRole(v === "all" ? "" : v as UserRole); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px] rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gender || "all"} onValueChange={(v) => { setGender(v === "all" ? "" : v as Gender); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px] rounded-xl"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={verified || "all"} onValueChange={(v) => { setVerified(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px] rounded-xl"><SelectValue placeholder="Verified" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>
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
    </div>
  );
}
