"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "./form-fields";
import { WARNING_CATEGORIES, WARNING_SEVERITIES } from "@/constants/geocontext";
import { useAddGeoWarning } from "@/hooks/useGeocontext";
import { getErrorMessage } from "@/utils";
import type { WarningCategory, WarningSeverity } from "@/types/geocontext";

interface WarningFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
}

export function WarningFormDialog({ open, onOpenChange, locationId, locationName }: WarningFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<WarningSeverity>("medium");
  const [category, setCategory] = useState<WarningCategory>("custom");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | undefined>();
  const mutation = useAddGeoWarning(locationId);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setCategory("custom");
    setActive(true);
    setExpiresAt("");
    setError(undefined);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const onSubmit = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    setError(undefined);
    mutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        active,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success(`Warning added to "${locationName}"`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const severityOptions: SelectOption[] = WARNING_SEVERITIES.map((s) => ({ value: s.value, label: s.label }));
  const categoryOptions: SelectOption[] = WARNING_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle>Add warning</DialogTitle>
              <DialogDescription>
                Attach a safety warning to {locationName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <TextInput label="Title" required value={title} onChange={setTitle} placeholder="e.g. Restricted photography" error={error && !title ? error : undefined} />
          <TextAreaField label="Description" required value={description} onChange={setDescription} rows={3} placeholder="Explain the warning and what visitors should do" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Severity" value={severity} onValueChange={(v) => setSeverity(v as WarningSeverity)} options={severityOptions} />
            <SelectField label="Category" value={category} onValueChange={(v) => setCategory(v as WarningCategory)} options={categoryOptions} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Expiration date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
              <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Shown in app & AI safety advice</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          {error && !title && !description && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="size-3.5" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <LoadingSpinner size="sm" /> : "Add warning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
