"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Landmark, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDeleteBoundary } from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import type { Boundary } from "@/types/geocontext";

function BoundaryView({
  boundary,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  boundary: Boundary;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      {boundary.description && <p className="text-sm text-muted-foreground">{boundary.description}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="mt-1 text-sm font-medium capitalize">{boundary.type}</p>
        </div>
        <div className="rounded-xl border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Vertices</p>
          <p className="mt-1 text-sm font-medium">{boundary.polygon.length}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-medium">{new Date(boundary.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
        {canDelete && (
          <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
        {canEdit && (
          <Button size="sm" onClick={onEdit}>
            <Edit3 className="size-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * View-details drawer for boundaries. Create / Edit forms live in the centered
 * {@link BoundaryFormModal}.
 */
export function BoundaryDrawerForm() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isView = target.kind === "boundary" && target.mode === "view";
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const boundary = isView ? ws.boundaries.find((b) => b.id === target.boundaryId) ?? null : null;

  const deleteMutation = useDeleteBoundary();

  const close = () => ws.closeDrawer();

  const requestDelete = () => {
    if (!boundary) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMutation.mutate(boundary.id, {
      onSuccess: () => {
        toast.success("Boundary deleted");
        ws.closeDrawer();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <Sheet open={isView} onOpenChange={(next) => !next && close()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-[34rem]">
        {isView && boundary && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Landmark className="size-4" />
                  </span>
                  <div>
                    <SheetTitle className="truncate text-base font-semibold">{boundary.name}</SheetTitle>
                    <p className="text-xs capitalize text-muted-foreground">
                      {boundary.type} · {boundary.polygon.length} vertices
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close drawer">
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <BoundaryView
                boundary={boundary}
                canEdit={ws.canEdit}
                canDelete={ws.canDelete}
                onEdit={() => ws.openBoundary(boundary, "edit")}
                onDelete={requestDelete}
              />
            </div>

            <div className="flex items-center gap-2 border-t border-border/50 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
              <Landmark className="size-3.5 shrink-0" />
              Use Edit to redraw the boundary polygon.
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}