"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Map as MapIcon, PencilLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "./form-fields";
import type { Boundary, GeoCoordinates } from "@/types/geocontext";

interface BoundaryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polygon: GeoCoordinates[];
  onRequestDraw: () => void;
  onCreated: (boundary: Boundary) => void;
}

export function BoundaryFormDialog({ open, onOpenChange, polygon, onRequestDraw, onCreated }: BoundaryFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Boundary["type"]>("governorate");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setName("");
    setDescription("");
    setType("governorate");
    setError(undefined);
    setSubmitting(false);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const canSubmit = polygon.length >= 3 && name.trim().length > 0;

  const onSubmit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (polygon.length < 3) {
      setError("Draw a boundary polygon on the map first");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    setTimeout(() => {
      onCreated({
        id: `boundary-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        polygon,
        createdAt: new Date().toISOString(),
      });
      toast.success("Boundary created");
      setSubmitting(false);
      onOpenChange(false);
    }, 300);
  };

  const typeOptions: SelectOption[] = [
    { value: "governorate", label: "Governorate" },
    { value: "city", label: "City" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <MapIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>New boundary</DialogTitle>
              <DialogDescription>
                Draw the boundary polygon on the map and name it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <TextInput label="Name" required value={name} onChange={setName} placeholder="e.g. Red Sea Governorate" error={error && !name ? error : undefined} />
          <TextAreaField label="Description" value={description} onChange={setDescription} rows={2} />
          <SelectField label="Boundary type" value={type} onValueChange={(v) => setType(v as Boundary["type"])} options={typeOptions} />

          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Polygon ({polygon.length} vertices)</p>
                <p className="text-xs text-muted-foreground">
                  {polygon.length >= 3 ? "Boundary captured from map" : "Draw a polygon on the map"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onRequestDraw}>
                <PencilLine className="size-4" />
                {polygon.length >= 3 ? "Redraw" : "Draw"}
              </Button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !canSubmit}>
            {submitting ? <LoadingSpinner size="sm" /> : "Create boundary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
