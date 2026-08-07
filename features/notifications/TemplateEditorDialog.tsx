"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Copy } from "lucide-react";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/useNotifications";
import { getErrorMessage } from "@/utils";
import type { NotificationTemplate } from "@/types/notifications";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

const EMPTY = { code: "", name: "", title: "", message: "" };

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NotificationTemplate | null;
}

export function TemplateEditorDialog({ open, onOpenChange, template }: TemplateDialogProps) {
  const isEdit = !!template;
  const [form, setForm] = useState<{ code: string; name: string; title: string; message: string }>(
    () =>
      template
        ? { code: template.code, name: template.name, title: template.title, message: template.message }
        : EMPTY
  );
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const reset = useCallback(() => setForm(EMPTY), []);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = () => {
    if (!form.code.trim() || !form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error("All fields are required");
      return;
    }
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      title: form.title.trim(),
      message: form.message.trim(),
      type: "INFO",
      category: "SYSTEM",
      priority: "NORMAL",
    };
    if (template) {
      updateMutation.mutate(
        { id: template.id, patch: { name: payload.name, title: payload.title, message: payload.message } },
        {
          onSuccess: () => {
            toast.success("Template updated");
            handleOpenChange(false);
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created");
          handleOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isEdit ? "Edit template" : "New template"}</ModalTitle>
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <Field label="Code">
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="welcome_alert_api_key_vars"
              disabled={isEdit}
            />
          </Field>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Welcome alert"
            />
          </Field>
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Hello {name}"
            />
          </Field>
          <Field label="Message">
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Welcome {name} — supports {variables}"
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <ModalFooter>
            <ModalClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Save changes" : "Create template"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export interface TemplateColumn {
  template: NotificationTemplate;
  onEdit: (template: NotificationTemplate) => void;
  onDelete: (template: NotificationTemplate) => void;
}

export function TemplatesToolbar({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={onNew}>
        <Plus className="size-4" /> New template
      </Button>
    </div>
  );
}

export function TemplateRowActions({ template, onEdit, onDelete }: TemplateColumn) {
  return (
    <div className="flex items-center gap-1">
      <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => onEdit(template)}>
        <Pencil className="size-4" />
      </Button>
      <Button size="icon-sm" variant="ghost" title="Copy code" onClick={() => { void navigator.clipboard?.writeText(template.code); toast.success("Code copied"); }}>
        <Copy className="size-4" />
      </Button>
      <Button size="icon-sm" variant="ghost" title="Delete" onClick={() => onDelete(template)}>
        <Trash2 className="size-4 text-red-500" />
      </Button>
    </div>
  );
}