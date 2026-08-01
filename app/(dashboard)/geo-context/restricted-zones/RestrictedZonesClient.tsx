"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RestrictedZone } from "@/lib/external/geo-restricted-zones";
import { createZoneAction, deleteZoneAction, updateZoneAction } from "@/lib/actions/geo-zone.actions";
import { geoZoneSchema, type GeoZoneFormValues } from "@/lib/validations/geo-zone.schema";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RestrictedZonesClientProps {
  initialZones: RestrictedZone[];
  error?: string;
}

const SUBTYPE_OPTIONS = ["school", "hospital", "airport", "mosque", "park", "other"];
const ZONE_TYPE_OPTIONS = ["restricted", "warning", "allowed"];

export function RestrictedZonesClient({ initialZones, error }: RestrictedZonesClientProps) {
  const [zones, setZones] = useState(initialZones);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestrictedZone | null>(null);
  const [editingZone, setEditingZone] = useState<RestrictedZone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<GeoZoneFormValues>({
    resolver: zodResolver(geoZoneSchema),
    defaultValues: {
      name: "",
      reason: "",
      subtype: "",
      zone_type: "restricted",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      reason: "",
      subtype: "",
      zone_type: "restricted",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    });
  };

  const columns = useMemo<ColumnDef<RestrictedZone>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <MapPin className="size-4" />
          </div>
          <div>
            <p className="font-medium">{row.original.name ?? "Unnamed zone"}</p>
            <p className="text-xs text-muted-foreground">{row.original.zone_type}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "subtype",
      header: "Subtype",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.subtype}</span>,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-sm">{row.original.reason ?? "—"}</span>,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => <SourceBadge source={row.original.source} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const openCreateDialog = () => {
    setEditingZone(null);
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (zone: RestrictedZone) => {
    setEditingZone(zone);
    form.reset({
      name: zone.name ?? "",
      reason: zone.reason ?? "",
      subtype: zone.subtype ?? "",
      zone_type: zone.zone_type ?? "restricted",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    });
    setIsOpen(true);
  };

  const handleSubmit = async (values: GeoZoneFormValues) => {
    setIsSubmitting(true);
    try {
      const submission = {
        ...values,
        geometry: values.geometry,
        source: "manual",
      };

      const result = editingZone
        ? await updateZoneAction(editingZone.id, submission)
        : await createZoneAction(submission);

      if (result.error) {
        const message = typeof result.error === "string"
          ? result.error
          : result.error?.formErrors?.[0] ?? "Please review the form and try again.";
        toast.error(message);
        return;
      }

      toast.success(editingZone ? "Zone updated" : "Zone created");
      const nextZones = editingZone
        ? zones.map((zone) => (zone.id === editingZone.id ? { ...zone, ...submission, id: zone.id } : zone))
        : [
            ...zones,
            {
              ...submission,
              id: `${Date.now()}`,
              osm_type: null,
              osm_id: null,
              source: "manual",
            } as RestrictedZone,
          ];

      setZones(nextZones);
      setIsOpen(false);
      resetForm();
      setEditingZone(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteZoneAction(deleteTarget.id);
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Unable to delete zone");
        return;
      }
      toast.success("Zone deleted");
      setZones((current) => current.filter((zone) => zone.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Restricted zones" description="Manage spatial restriction zones from GeoContext" />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restricted zones"
        description="Manage spatial restriction zones from GeoContext"
      >
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add zone
        </Button>
      </PageHeader>

      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        {zones.length === 0 ? (
          <EmptyState
            title="No restricted zones yet"
            description="Add a zone to start managing restricted areas in GeoContext."
            action={{ label: "Add zone", onClick: openCreateDialog }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={zones}
            emptyTitle="No restricted zones found"
            emptyDescription="Try adjusting your search or create a new zone"
          />
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
          setEditingZone(null);
        }
      }}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Edit zone" : "Add zone"}</DialogTitle>
            <DialogDescription>
              {editingZone ? "Update the restricted zone details below." : "Create a new restricted zone in GeoContext."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input {...form.register("name")} placeholder="e.g. Downtown restricted area" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtype</label>
                <Input {...form.register("subtype")} placeholder="Enter subtype" />
                {form.formState.errors.subtype && (
                  <p className="text-sm text-destructive">{form.formState.errors.subtype.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Input {...form.register("reason")} placeholder="Why this zone exists" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zone type</label>
                <Select
                  value={form.watch("zone_type") ?? "restricted"}
                  onValueChange={(value) => form.setValue("zone_type", value ?? "restricted")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPE_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Geometry (GeoJSON)</label>
              <textarea
                {...form.register("geometry")}
                className="min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                defaultValue={JSON.stringify({ type: "Point", coordinates: [0, 0] }, null, 2)}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value);
                    form.setValue("geometry", parsed, { shouldValidate: true });
                  } catch {
                    form.setValue("geometry", { type: "Point", coordinates: [0, 0] }, { shouldValidate: true });
                  }
                }}
              />
              {form.formState.errors.geometry && (
                <p className="text-sm text-destructive">Geometry must be valid GeoJSON</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner size="sm" /> : editingZone ? "Save changes" : "Create zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete zone"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? "this zone"}?`}
        variant="destructive"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isManual = source === "manual";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isManual
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
      )}
    >
      {isManual ? "Manual" : source}
    </span>
  );
}
