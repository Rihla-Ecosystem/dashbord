"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Plus, Trash2, MapPin } from "lucide-react";
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
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RestrictedZone } from "@/lib/external/geo-restricted-zones";
import { createZoneAction, deleteZoneAction, updateZoneAction } from "@/lib/actions/geo-zone.actions";
import {
  SUBTYPE_OPTIONS,
  ZONE_TYPE_OPTIONS,
  geometrySchema,
  geoZoneSchema,
  type GeoJsonGeometry,
  type GeoZoneFormValues,
  type Subtype,
  type ZoneType,
} from "@/lib/validations/geo-zone.schema";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RestrictedZonesClientProps {
  initialZones: RestrictedZone[];
  error?: string;
}

const DEFAULT_GEOMETRY: GeoJsonGeometry = { type: "Point", coordinates: [0, 0] };

const emptyFormValues = (): GeoZoneFormValues =>
  ({
    name: "",
    reason: "",
    info: "",
    subtype: "",
    zone_type: "restricted",
    geometry: DEFAULT_GEOMETRY,
  }) as unknown as GeoZoneFormValues;

function geometryToText(geometry: GeoJsonGeometry | null | undefined): string {
  return JSON.stringify(geometry ?? DEFAULT_GEOMETRY, null, 2);
}

function parseGeometry(text: string): GeoJsonGeometry | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const result = geometrySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const flattened = error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    if (flattened.formErrors?.length) return flattened.formErrors[0];
    const field = Object.entries(flattened.fieldErrors ?? {});
    if (field.length) {
      const [key, messages] = field[0];
      return `${key}: ${messages?.[0] ?? "invalid"}`;
    }
  }
  return "Something went wrong. Please try again.";
}

export function RestrictedZonesClient({ initialZones, error }: RestrictedZonesClientProps) {
  const [zones, setZones] = useState(initialZones);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestrictedZone | null>(null);
  const [editingZone, setEditingZone] = useState<RestrictedZone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingZone, setViewingZone] = useState<RestrictedZone | null>(null);
  const [geometryText, setGeometryText] = useState(() => geometryToText(DEFAULT_GEOMETRY));
  const [geometryError, setGeometryError] = useState<string | null>(null);

  const form = useForm<GeoZoneFormValues>({
    resolver: zodResolver(geoZoneSchema),
    defaultValues: emptyFormValues(),
  });

  const resetForm = useCallback(() => {
    form.reset(emptyFormValues());
    setGeometryText(geometryToText(DEFAULT_GEOMETRY));
    setGeometryError(null);
  }, [form]);

  const handleGeometryChange = useCallback((text: string) => {
    setGeometryText(text);
    const geometry = parseGeometry(text);
    if (geometry) {
      form.setValue("geometry", geometry);
      form.clearErrors("geometry");
      setGeometryError(null);
    } else {
      setGeometryError("Geometry must be valid GeoJSON");
    }
  }, [form]);

  const watchedSubtype = useWatch({ control: form.control, name: "subtype" });
  const watchedZoneType = useWatch({ control: form.control, name: "zone_type" });

  const openCreateDialog = useCallback(() => {
    setEditingZone(null);
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((zone: RestrictedZone) => {
    setEditingZone(zone);
    form.reset({
      name: zone.name ?? "",
      reason: zone.reason ?? "",
      info: zone.info ?? "",
      subtype: zone.subtype,
      zone_type: zone.zone_type ?? "restricted",
      geometry: zone.geometry ?? DEFAULT_GEOMETRY,
    } as unknown as GeoZoneFormValues);
    setGeometryText(geometryToText(zone.geometry));
    setGeometryError(null);
    setIsOpen(true);
  }, [form]);

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
            onClick={() => setViewingZone(row.original)}
          >
            <Eye className="size-4" />
          </Button>
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
  ], [openEditDialog]);

  const handleSubmit = async (values: GeoZoneFormValues) => {
    const parsedGeometry = parseGeometry(geometryText);
    if (!parsedGeometry) {
      setGeometryError("Geometry must be valid GeoJSON");
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = {
        name: values.name,
        reason: values.reason,
        info: values.info,
        subtype: values.subtype,
        zone_type: values.zone_type ?? "restricted",
        geometry: parsedGeometry,
        source: "manual",
      };

      const result = editingZone
        ? await updateZoneAction(editingZone.id, submission)
        : await createZoneAction(submission);

      if ("error" in result) {
        toast.error(getErrorMessage(result.error));
        return;
      }

      toast.success(editingZone ? "Zone updated" : "Zone created");

      if (result.data) {
        if (editingZone) {
          setZones((current) => current.map((zone) => (zone.id === editingZone.id ? result.data : zone)));
        } else {
          setZones((current) => [...current, result.data]);
        }
      }

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
      if ("error" in result) {
        toast.error(getErrorMessage(result.error));
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
                <Select
                  value={watchedSubtype ?? ""}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue("subtype", value as Subtype, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Select subtype" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBTYPE_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  value={watchedZoneType ?? "restricted"}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue("zone_type", value as ZoneType, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-xl">
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
                {form.formState.errors.zone_type && (
                  <p className="text-sm text-destructive">{form.formState.errors.zone_type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Info</label>
              <textarea
                {...form.register("info")}
                className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                placeholder="Optional notes about data that will be added in the future"
              />
              {form.formState.errors.info && (
                <p className="text-sm text-destructive">{form.formState.errors.info.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Geometry (GeoJSON)</label>
              <textarea
                value={geometryText}
                onChange={(event) => handleGeometryChange(event.target.value)}
                className="min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                placeholder='{ "type": "Point", "coordinates": [0, 0] }'
              />
              {(geometryError || form.formState.errors.geometry) && (
                <p className="text-sm text-destructive">{geometryError ?? "Geometry must be valid GeoJSON"}</p>
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

      <Dialog open={!!viewingZone} onOpenChange={(open) => { if (!open) setViewingZone(null); }}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{viewingZone?.name ?? "Zone details"}</DialogTitle>
            <DialogDescription>Full details for this restricted zone.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Subtype">{viewingZone?.subtype}</DetailItem>
            <DetailItem label="Zone type">{viewingZone?.zone_type}</DetailItem>
            <DetailItem label="Reason">{viewingZone?.reason}</DetailItem>
            <DetailItem label="Source">
              {viewingZone?.source ? <SourceBadge source={viewingZone.source} /> : "—"}
            </DetailItem>
            <DetailItem label="OSM">
              {viewingZone?.osm_id != null
                ? `${viewingZone.osm_type ?? "osm"}#${viewingZone.osm_id}`
                : "—"}
            </DetailItem>
            <DetailItem label="ID">{viewingZone?.id}</DetailItem>
            <div className="sm:col-span-2">
              <DetailItem label="Info">{viewingZone?.info}</DetailItem>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Geometry</p>
              <pre className="mt-1 max-h-52 overflow-auto rounded-xl border border-border/50 bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                {viewingZone?.geometry ? JSON.stringify(viewingZone.geometry, null, 2) : "—"}
              </pre>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setViewingZone(null)}>
              Close
            </Button>
          </DialogFooter>
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

function DetailItem({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{children ?? "—"}</div>
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
