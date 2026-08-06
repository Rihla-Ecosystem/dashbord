"use client";

import { Calendar, Landmark, Pencil, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { LayerPill } from "./badges";
import { formatDate } from "@/utils";
import type { Boundary } from "@/types/geocontext";

interface BoundaryDrawerProps {
  boundary: Boundary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function BoundaryDrawer({ boundary, open, onOpenChange, canEdit, canDelete, onEdit, onDelete }: BoundaryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md sm:gap-3">
        {boundary && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                <Landmark className="size-6" />
              </div>
              <div>
                <SheetTitle className="text-lg">{boundary.name}</SheetTitle>
                <SheetDescription className="capitalize">{boundary.type} boundary</SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 px-4">
              <LayerPill label={boundary.type} tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
              <LayerPill label={`${boundary.polygon.length} vertices`} tone="bg-muted text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              {boundary.description && <p className="text-sm text-muted-foreground">{boundary.description}</p>}

              <div className="grid grid-cols-2 gap-3">
                <InfoCell icon={<Type className="size-4" />} label="Type" value={boundary.type} />
                <InfoCell icon={<Calendar className="size-4" />} label="Created" value={formatDate(boundary.createdAt)} />
              </div>
            </div>

            <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
              {canEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium capitalize">{value}</p>
    </div>
  );
}