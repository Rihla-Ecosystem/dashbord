"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateNotification } from "@/hooks/useNotifications";
import { getErrorMessage } from "@/utils";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from "@/types/notifications";

const TYPE_OPTIONS: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"];
const CATEGORY_OPTIONS: NotificationCategory[] = [
  "SAFETY",
  "SECURITY",
  "WEATHER",
  "TRAFFIC",
  "TOURIST",
  "HISTORICAL",
  "EMERGENCY",
  "RESTRICTED_AREA",
  "PHOTOGRAPHY",
  "RECOMMENDATION",
  "SYSTEM",
];
const PRIORITY_OPTIONS: NotificationPriority[] = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

interface ComposeNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeNotificationDialog({ open, onOpenChange }: ComposeNotificationDialogProps) {
  const [type, setType] = useState<NotificationType>("INFO");
  const [category, setCategory] = useState<NotificationCategory>("SYSTEM");
  const [priority, setPriority] = useState<NotificationPriority>("NORMAL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendAll, setSendAll] = useState(true);
  const [userIds, setUserIds] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  const createMutation = useCreateNotification();

  const reset = useCallback(() => {
    setType("INFO");
    setCategory("SYSTEM");
    setPriority("NORMAL");
    setTitle("");
    setMessage("");
    setSendAll(true);
    setUserIds("");
    setScheduleAt("");
  }, []);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const userIdsList = userIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    createMutation.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        type,
        category,
        priority,
        audience: sendAll ? { all: true } : { userIds: userIdsList },
        schedule: scheduleAt ? { sendAt: new Date(scheduleAt).toISOString() } : undefined,
      },
      {
        onSuccess: (result) => {
          toast.success(
            result.scheduled ? "Notification scheduled" : `Sent to ${result.recipients} recipients`
          );
          handleOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Compose notification</ModalTitle>
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Type">
              <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as NotificationPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
          </Field>

          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Send to all users</p>
              <p className="text-xs text-muted-foreground">
                {sendAll ? "Broadcast to every active user" : "Target specific users by ID (comma separated)"}
              </p>
            </div>
            <Switch checked={sendAll} onCheckedChange={setSendAll} />
          </div>

          {!sendAll && (
            <Field label="Recipient user IDs">
              <Input value={userIds} onChange={(e) => setUserIds(e.target.value)} placeholder="uuid, uuid, ..." />
            </Field>
          )}

          <Field label="Schedule (optional)">
            <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </Field>

          <ModalFooter>
            <ModalClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Sending…" : scheduleAt ? "Schedule" : "Send"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}