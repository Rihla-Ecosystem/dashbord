"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bell,
  History,
  LayoutDashboard,
  ListChecks,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ScrollText,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { RoleGuard } from "@/features/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAdminNotifications,
  useCancelScheduled,
  useContextReports,
  useDeleteTemplate,
  useNotificationAnalytics,
  useNotificationHistory,
  useNotificationLogs,
  useNotificationTemplates,
  useProcessScheduled,
} from "@/hooks/useNotifications";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDateTime } from "@/utils";
import {
  NotificationCategoryBadge,
  NotificationPriorityBadge,
  NotificationSourceBadge,
  NotificationTypeBadge,
} from "@/features/notifications/notification-badges";
import { ComposeNotificationDialog } from "@/features/notifications/ComposeNotificationDialog";
import { ContextReportDetailModal } from "@/features/notifications/ContextReportDetail";
import { NotificationSettingsPanel } from "@/features/notifications/NotificationSettings";
import {
  TemplateEditorDialog,
  TemplatesToolbar,
  TemplateRowActions,
} from "@/features/notifications/TemplateEditorDialog";
import type {
  AdminNotificationListItem,
  ContextReportListItem,
  NotificationDeliveryLogItem,
  NotificationHistoryItem,
  NotificationTemplate,
} from "@/types/notifications";

const PRIORITY_OPTIONS = ["ALL", "LOW", "NORMAL", "HIGH", "CRITICAL"];

export default function NotificationsPage() {
  return (
    <RoleGuard roles={["ADMIN", "MODERATOR"]}>
      <NotificationsWorkspace />
    </RoleGuard>
  );
}

function NotificationsWorkspace() {
  const [tab, setTab] = useState("overview");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // notifications table
  const [priority, setPriority] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  // templates
  const [templateSearch, setTemplateSearch] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const notificationsQuery = useAdminNotifications({
    page,
    limit,
    priority: priority === "ALL" ? undefined : priority,
  });
  const analyticsQuery = useNotificationAnalytics();
  const templatesQuery = useNotificationTemplates({ search: templateSearch || undefined, limit: 100 });
  const historyQuery = useNotificationHistory({ limit: 50 });
  const logsQuery = useNotificationLogs({ limit: 50 });
  const reportsQuery = useContextReports({ limit: 50 });

  const deleteTemplateMutation = useDeleteTemplate();
  const cancelMutation = useCancelScheduled();
  const processScheduled = useProcessScheduled();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const templates = templatesQuery.data?.templates ?? [];
  const history = historyQuery.data?.history ?? [];
  const logs = logsQuery.data?.logs ?? [];
  const reports = reportsQuery.data?.reports ?? [];

  const notificationColumns = useMemo<ColumnDef<AdminNotificationListItem>[]>(
    () => [
      { header: "Title", accessorKey: "title", cell: (c) => <span className="font-medium">{String(c.getValue())}</span> },
      { header: "Type", accessorKey: "type", cell: (c) => <NotificationTypeBadge type={c.row.original.type} /> },
      { header: "Category", accessorKey: "category", cell: (c) => <NotificationCategoryBadge category={c.row.original.category} /> },
      { header: "Priority", accessorKey: "priority", cell: (c) => <NotificationPriorityBadge priority={c.row.original.priority} /> },
      { header: "Source", accessorKey: "source", cell: (c) => <NotificationSourceBadge source={c.row.original.source} /> },
      { header: "Status", accessorKey: "isRead", cell: (c) => (c.row.original.isRead ? "Read" : "Unread") },
      { header: "Created", accessorKey: "createdAt", cell: (c) => formatDateTime(String(c.getValue())) },
    ],
    []
  );

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };
  const openEditTemplate = (t: NotificationTemplate) => {
    setEditingTemplate(t);
    setTemplateDialogOpen(true);
  };
  const handleDeleteTemplate = (t: NotificationTemplate) => {
    deleteTemplateMutation.mutate(t.id, { onSuccess: () => undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Notifications" description="Compose, schedule and review context-aware notifications across the platform.">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => processScheduled.mutate()}
            disabled={processScheduled.isPending}
          >
            <RefreshCw className="size-4" /> Process scheduled
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus className="size-4" /> Compose
          </Button>
        </div>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" icon={<LayoutDashboard className="size-4" />}>Overview</TabsTrigger>
          <TabsTrigger value="notifications" icon={<Bell className="size-4" />}>Notifications</TabsTrigger>
          <TabsTrigger value="templates" icon={<ListChecks className="size-4" />}>Templates</TabsTrigger>
          <TabsTrigger value="history" icon={<History className="size-4" />}>History</TabsTrigger>
          <TabsTrigger value="logs" icon={<ScrollText className="size-4" />}>Logs</TabsTrigger>
          <TabsTrigger value="reports" icon={<MapPin className="size-4" />}>Context reports</TabsTrigger>
          <TabsTrigger value="settings" icon={<SlidersHorizontal className="size-4" />}>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewGrid analytics={analyticsQuery.data ?? undefined} notifications={notifications} />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Select value={priority} onValueChange={(v) => { if (v) { setPriority(v); setPage(1); } }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p === "ALL" ? "All priorities" : p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DataTable
              columns={notificationColumns}
              data={notifications}
              isLoading={notificationsQuery.isLoading}
              emptyTitle="No notifications"
              emptyDescription="Compose a notification to get started."
            />
            {!!notificationsQuery.data?.pagination.total && (
              <Pagination
                page={page}
                totalPages={notificationsQuery.data.pagination.totalPages}
                total={notificationsQuery.data.pagination.total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates…"
                className="max-w-xs"
              />
              <TemplatesToolbar onNew={openNewTemplate} />
            </div>
            <TemplateTable
              templates={templates}
              isLoading={templatesQuery.isLoading}
              onEdit={openEditTemplate}
              onDelete={handleDeleteTemplate}
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <HistoryList history={history} onCancel={(id) => cancelMutation.mutate(id)} />
        </TabsContent>

        <TabsContent value="logs">
          {logsQuery.isLoading ? <LoadingBlock label="Loading logs…" /> : <LogsList logs={logs} />}
        </TabsContent>

        <TabsContent value="reports">
          {reportsQuery.isLoading ? <LoadingBlock label="Loading reports…" /> : <ReportsList reports={reports} onOpen={(id) => setSelectedReportId(id)} />}
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettingsPanel />
        </TabsContent>
      </Tabs>

      <ComposeNotificationDialog open={composeOpen} onOpenChange={setComposeOpen} />
      <ContextReportDetailModal
        reportId={selectedReportId ?? ""}
        open={!!selectedReportId}
        onOpenChange={(o) => { if (!o) setSelectedReportId(null); }}
      />
      <TemplateEditorDialog
        key={editingTemplate?.id ?? "new"}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
      />
    </div>
  );
}

function OverviewGrid({
  analytics,
  notifications,
}: {
  analytics: Awaited<ReturnType<typeof useNotificationAnalytics>["data"]> | undefined;
  notifications: AdminNotificationListItem[];
}) {
  if (!analytics) {
    return <LoadingBlock label="Loading analytics…" />;
  }
  const top = notifications[0];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total sent" value={analytics.totalSent ?? 0} icon={<Bell className="size-5" />} gradient="from-blue-500/15 to-blue-500/5" />
        <StatCard title="Read" value={analytics.totalRead ?? 0} icon={<ListChecks className="size-5" />} gradient="from-emerald-500/15 to-emerald-500/5" />
        <StatCard title="Unread" value={analytics.totalUnread ?? 0} icon={<Bell className="size-5" />} gradient="from-amber-500/15 to-amber-500/5" />
        <StatCard title="Read rate" value={`${analytics.readRate ?? 0}%`} icon={<ListChecks className="size-5" />} gradient="from-violet-500/15 to-violet-500/5" />
      </div>
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">By category</h3>
        {analytics.byCategory?.length ? (
          <div className="flex flex-wrap gap-2">
            {analytics.byCategory.map((c) => (
              <span key={c.category} className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium">
                {c.category}: {c.count}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notifications sent yet.</p>
        )}
        {top && (
          <div className="mt-4 border-t border-border/50 pt-4 text-sm">
            <p className="font-medium">{top.title}</p>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground">{top.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateTable({
  templates,
  isLoading,
  onEdit,
  onDelete,
}: {
  templates: NotificationTemplate[];
  isLoading: boolean;
  onEdit: (t: NotificationTemplate) => void;
  onDelete: (t: NotificationTemplate) => void;
}) {
  const columns = useMemo<ColumnDef<NotificationTemplate>[]>(
    () => [
      { header: "Code", accessorKey: "code", cell: (c) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{String(c.getValue())}</code> },
      { header: "Name", accessorKey: "name", cell: (c) => <span className="font-medium">{String(c.getValue())}</span> },
      { header: "Title", accessorKey: "title" },
      { header: "Message", accessorKey: "message", cell: (c) => <span className="line-clamp-1 max-w-[260px] text-muted-foreground">{String(c.getValue())}</span> },
      { header: "Active", accessorKey: "isActive", cell: (c) => (c.row.original.isActive ? "Yes" : "No") },
      { header: "", id: "actions", cell: (c) => <TemplateRowActions template={c.row.original} onEdit={onEdit} onDelete={onDelete} /> },
    ],
    [onEdit, onDelete]
  );
  return (
    <DataTable columns={columns} data={templates} isLoading={isLoading} emptyTitle="No templates" emptyDescription="Create a reusable template." />
  );
}

function HistoryList({ history, onCancel }: { history: NotificationHistoryItem[]; onCancel: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">Title</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Recipients</th>
            <th className="px-3 py-2 font-semibold">Delivered</th>
            <th className="px-3 py-2 font-semibold">Created</th>
            <th className="px-3 py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-t border-border/50">
              <td className="px-3 py-2 font-medium">{h.title}</td>
              <td className="px-3 py-2">{h.status}</td>
              <td className="px-3 py-2">{h.recipients}</td>
              <td className="px-3 py-2">{h.delivered}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDateTime(h.createdAt)}</td>
              <td className="px-3 py-2">
                {h.status === "SCHEDULED" && (
                  <Button size="sm" variant="outline" onClick={() => onCancel(h.id)}>
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No history yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LogsList({ logs }: { logs: NotificationDeliveryLogItem[] }) {
  return (
    <div className="space-y-1">
      {logs.map((l) => (
        <div key={l.id} className="relative flex gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
          <div className="mt-1 flex flex-col items-center">
            <span className="size-2 rounded-full bg-primary" />
            <span className="w-px flex-1 bg-border/60" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{l.event}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</span>
            </div>
            {l.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{l.detail}</p>}
            {l.user && <p className="mt-1 text-xs text-muted-foreground">{l.user.displayName ?? l.user.email}</p>}
          </div>
        </div>
      ))}
      {logs.length === 0 && <EmptyState title="No logs" description="Delivery events will appear here." />}
    </div>
  );
}

function ReportsList({ reports, onOpen }: { reports: ContextReportListItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {reports.map((r) => (
        <button
          key={r.id}
          onClick={() => onOpen(r.id)}
          className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <div>
            <p className="font-medium">{r.areaName ?? "—"} ({r.lat.toFixed(4)}, {r.lng.toFixed(4)})</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.summary ?? ""}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
            <span className="text-xs font-semibold text-primary">View report →</span>
          </div>
        </button>
      ))}
      {reports.length === 0 && <EmptyState title="No context reports" description="Location updates will generate reports here." />}
    </div>
  );
}

function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}