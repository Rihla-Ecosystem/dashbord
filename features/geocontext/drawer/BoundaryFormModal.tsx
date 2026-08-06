"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Landmark, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "../form-fields";
import { ringCentroid } from "../drawing/geometry";
import { useCreateBoundary, useUpdateBoundary } from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import type { Boundary, GeoCoordinates } from "@/types/geocontext";

const TYPE_OPTIONS: SelectOption[] = [
  { value: "governorate", label: "Governorate" },
  { value: "city", label: "City" },
  { value: "custom", label: "Custom" },
];

function BoundaryForm({
  boundary,
  polygon,
  onCancel,
  onSaved,
}: {
  boundary: Boundary | null;
  polygon: GeoCoordinates[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!boundary;
  const [name, setName] = useState(boundary?.name ?? "");
  const [description, setDescription] = useState(boundary?.description ?? "");
  const [type, setType] = useState<Boundary["type"]>(boundary?.type ?? "governorate");
  const [error, setError] = useState<string | undefined>();

  const ws = useGeoWorkspace();
  const createMutation = useCreateBoundary();
  const updateMutation = useUpdateBoundary(boundary?.id ?? "");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const poly = polygon?.length ? polygon : (boundary?.polygon ?? []);
  const canSubmit = poly.length >= 3 && name.trim().length > 0;

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (poly.length < 3) {
      setError("Draw a boundary polygon on the map first");
      return;
    }
    setError(undefined);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      polygon: poly,
    };
    if (isEdit && boundary) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Boundary updated");
          onSaved();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Boundary created");
          onSaved();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  return (
    <div className="space-y-4">
      <TextInput label="Name" required value={name} onChange={setName} placeholder="e.g. Red Sea Governorate" error={error && !name ? error : undefined} />
      <TextAreaField label="Description" value={description} onChange={setDescription} rows={2} />
      <SelectField label="Boundary type" value={type} onValueChange={(v) => setType(v as Boundary["type"])} options={TYPE_OPTIONS} />

      <div className="rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Polygon ({poly.length} vertices)</p>
            <p className="text-xs text-muted-foreground">
              {poly.length >= 3 ? "Boundary captured from map" : "Draw a polygon on the map"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ws.setSection("map");
              ws.requestDraw();
            }}
          >
            <PencilLine className="size-4" />
            Draw
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isSubmitting || !canSubmit} title={!canSubmit ? "Draw a polygon and enter a name" : undefined}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : <Check className="size-4" />}
          {isEdit ? "Save boundary" : "Create boundary"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Centered Create / Edit modal for boundaries. View details stay in the right
 * {@link BoundaryDrawerForm} drawer.
 */
export function BoundaryFormModal() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isCreate = target.kind === "create-boundary";
  const isEdit = target.kind === "boundary" && target.mode === "edit";
  const open = isCreate || isEdit;

  const boundary = isEdit ? ws.boundaries.find((b) => b.id === target.boundaryId) ?? null : null;
  const drawnPolygon = ws.draftGeometry?.parts.find((p) => p.type === "polygon")?.coords ?? null;
  const polygon = isCreate ? target.polygon : (drawnPolygon ?? boundary?.polygon ?? []);

  const close = () => {
    if (isEdit && boundary) ws.openBoundary(boundary, "view");
    else ws.closeDrawer();
  };

  const onSaved = () => {
    if (isCreate && polygon.length >= 3) {
      const c = ringCentroid(polygon);
      ws.flyToMap(c.lat, c.lng, 11);
    }
    ws.setDrawMode(null);
    ws.setDrawIntent(null);
    if (isEdit && boundary) ws.openBoundary(boundary, "view");
    else ws.closeDrawer();
  };

  return (
    <Modal open={open} onOpenChange={(next) => !next && close()}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Landmark className="size-4" />
            </span>
            <div className="min-w-0">
              <ModalTitle>{isCreate ? "New boundary" : boundary?.name ?? "Boundary"}</ModalTitle>
              <ModalDescription>
                {isCreate
                  ? "Draw the boundary polygon, then name it."
                  : boundary?.type
                    ? `Edit the ${boundary.type} boundary.`
                    : "Edit this boundary."}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <BoundaryForm
            key={`${isCreate ? "create" : `${boundary?.id}-${boundary?.polygon.length ?? 0}`}`}
            boundary={boundary}
            polygon={polygon}
            onCancel={() => {
              if (isEdit && boundary) ws.openBoundary(boundary, "view");
              else ws.closeDrawer();
            }}
            onSaved={onSaved}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}