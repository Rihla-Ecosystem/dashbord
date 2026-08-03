"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { List, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { ActivityTimeline } from "@/features/dashboard/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import type { AuditLog } from "@/types";
import { formatDateTime } from "@/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "timeline">("table");

  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    limit,
    search: search || undefined,
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.action}</span>
      ),
    },
    {
      accessorKey: "actorName",
      header: "Actor",
      cell: ({ row }) =>
        row.original.actorName ?? row.original.actorEmail ?? row.original.actorId,
    },
    {
      accessorKey: "targetType",
      header: "Target",
      cell: ({ row }) => row.original.targetType ?? "—",
    },
    {
      accessorKey: "ipAddress",
      header: "IP",
      cell: ({ row }) => row.original.ipAddress ?? "—",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
  ];

  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Track all administrative actions">
        <div className="flex rounded-xl border border-border/50 p-1">
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg"
            onClick={() => setView("table")}
          >
            <List className="size-4" />
            Table
          </Button>
          <Button
            variant={view === "timeline" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg"
            onClick={() => setView("timeline")}
          >
            <Clock className="size-4" />
            Timeline
          </Button>
        </div>
      </PageHeader>

<<<<<<< HEAD
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search logs..."
      />
=======
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search logs..."
        />
      </FilterBar>
>>>>>>> ec93b98 (fix(dashboard): resolve 72 TS errors, clean lint, restore broken data hooks)

      {view === "table" ? (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            emptyTitle="No audit logs"
            emptyDescription="Activity will appear here"
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
        </>
      ) : (
        <div className={cn("rounded-2xl border border-border/50 bg-card p-6")}>
          <ActivityTimeline logs={data?.data ?? []} />
        </div>
      )}
    </div>
  );
}
