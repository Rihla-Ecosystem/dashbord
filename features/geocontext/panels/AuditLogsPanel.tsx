"use client";

import { useMemo, useState } from "react";
import { Clock, List, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { SkeletonTable } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatDateTime } from "@/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * Server-paginated audit log view for the GeoContext workspace.
 * Delegates to the shared admin audit-log API so records stay consistent
 * across the dashboard.
 */
export function AuditLogsPanel() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<"table" | "timeline">("table");

  const { data, isLoading, error, refetch } = useAuditLogs({ page, limit });

  const logs = useMemo(() => data?.data ?? [], [data]);

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Failed to load audit logs" message={error.message} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <ScrollText className="size-4 text-primary" />
          <span className="font-semibold">Audit logs</span>
        </span>
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} records</span>
        <div className="ml-auto flex rounded-xl border border-border/50 p-0.5">
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            className="h-7 rounded-lg px-2.5 text-xs"
            onClick={() => setView("table")}
          >
            <List className="size-3.5" />
            Table
          </Button>
          <Button
            variant={view === "timeline" ? "default" : "ghost"}
            size="sm"
            className="h-7 rounded-lg px-2.5 text-xs"
            onClick={() => setView("timeline")}
          >
            <Clock className="size-3.5" />
            Timeline
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs"
            description="Administrative actions in GeoContext will appear here."
            icon={<ShieldCheck className="size-7" />}
          />
        ) : view === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap font-medium">{log.action}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {log.actorName ?? log.actorEmail ?? log.actorId}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{log.targetType ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                    <TableCell className={cn("whitespace-nowrap text-sm text-muted-foreground")}>
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            {logs.map((log, i) => (
              <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className={cn("relative z-10 mt-1 size-[22px] shrink-0 rounded-full border-2 border-background", i === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-snug">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.actorName ?? log.actorEmail ?? log.actorId}
                    {log.targetType && ` · ${log.targetType}`}
                    {log.ipAddress && ` · ${log.ipAddress}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="border-t border-border/50 p-4">
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}
