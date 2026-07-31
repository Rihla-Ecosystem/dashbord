"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { StatusBadge } from "@/components/shared/RoleBadge";
import type { User } from "@/types";
import { formatDate, formatXp, getInitials } from "@/utils";

interface RecentUsersTableProps {
  users: User[];
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
  if (!users.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No users yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="hidden pb-3 pr-4 font-medium sm:table-cell">Role</th>
            <th className="hidden pb-3 pr-4 font-medium md:table-cell">Level</th>
            <th className="hidden pb-3 pr-4 font-medium lg:table-cell">XP</th>
            <th className="hidden pb-3 pr-4 font-medium md:table-cell">Verified</th>
            <th className="hidden pb-3 pr-4 font-medium xl:table-cell">Created</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/30 last:border-0">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="hidden py-3 pr-4 sm:table-cell">
                <RoleBadge role={user.role} />
              </td>
              <td className="hidden py-3 pr-4 md:table-cell">{user.level}</td>
              <td className="hidden py-3 pr-4 lg:table-cell">{formatXp(user.xp)}</td>
              <td className="hidden py-3 pr-4 md:table-cell">
                <StatusBadge status={user.verified ? "verified" : "pending"} />
              </td>
              <td className="hidden py-3 pr-4 text-muted-foreground xl:table-cell">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem render={<Link href={`/users/${user.id}`} />}>
                      <Eye className="size-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/users/${user.id}?edit=true`} />}>
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">
                      <Ban className="size-4" /> Ban
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
