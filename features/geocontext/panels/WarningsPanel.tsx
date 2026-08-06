"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/LoadingSpinner";
import { SeverityBadge } from "../badges";
import { geocontextApi } from "@/services/geocontext";
import { GEO_QUERY_KEYS } from "@/constants/geocontext";
import { formatRelative, getErrorMessage } from "@/utils";
import { useGeoWorkspace } from "../workspace-context";

export function WarningsPanel() {
  const ws = useGeoWorkspace();
  const queryClient = useQueryClient();

  const warnings = useMemo(
    () => ws.locations.flatMap((l) => l.warnings.map((w) => ({ ...w, locationId: l.id, locationName: l.nameEn }))),
    [ws.locations]
  );

  const remove = (locationId: string, warningId: string) => {
    if (!ws.canEdit) return;
    geocontextApi
      .deleteWarning(locationId, warningId)
      .then(() => {
        toast.success("Warning removed");
        queryClient.invalidateQueries({ queryKey: ["geocontext", "locations"] });
        queryClient.invalidateQueries({ queryKey: GEO_QUERY_KEYS.analytics });
        queryClient.invalidateQueries({ queryKey: GEO_QUERY_KEYS.activity });
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <AlertCircle className="size-4 text-amber-500" />
          <span className="font-semibold">{warnings.length} warnings</span>
        </span>
        <span className="text-sm text-muted-foreground">
          {warnings.filter((w) => w.active).length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {ws.isLocationsLoading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : warnings.length === 0 ? (
          <EmptyState
            title="No warnings"
            description="Warnings raised on a location appear here."
            icon={<AlertCircle className="size-7" />}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map((warning) => (
                  <TableRow key={warning.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap font-medium">{warning.title}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{warning.locationName}</TableCell>
                    <TableCell className="whitespace-nowrap"><SeverityBadge severity={warning.severity} /></TableCell>
                    <TableCell className="whitespace-nowrap capitalize text-muted-foreground">{warning.category.replace("_", " ")}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {warning.active ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatRelative(warning.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex justify-end">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Delete warning"
                          disabled={!ws.canEdit}
                          onClick={() => remove(warning.locationId, warning.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}