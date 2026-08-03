"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { User, Bell, Globe, Palette, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useProfileMutations } from "@/hooks/useProfile";
import { useAuth } from "@/features/auth/auth-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { deleteAccount } = useProfileMutations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Manage your preferences and account" />

      <DashboardCard title="Appearance">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
<<<<<<< HEAD
            <Select value={theme ?? "system"} onValueChange={(value) => {
              if (value !== null) {
                setTheme(value);
              }
            }}>
=======
            <Select value={theme ?? "system"} onValueChange={(v) => { if (v) setTheme(v); }}>
>>>>>>> ec93b98 (fix(dashboard): resolve 72 TS errors, clean lint, restore broken data hooks)
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Language">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Display Language</p>
              <p className="text-sm text-muted-foreground">Choose your preferred language</p>
            </div>
          </div>
          <Select defaultValue="en">
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DashboardCard>

      <DashboardCard title="Profile">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Edit Profile</p>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl" render={<Link href="/profile" />} nativeButton={false}>
            Manage
          </Button>
        </div>
      </DashboardCard>

      <DashboardCard title="Notifications">
        <div className="space-y-4">
          {[
            { key: "email" as const, label: "Email notifications", desc: "Receive updates via email" },
            { key: "push" as const, label: "Push notifications", desc: "Browser push notifications" },
            { key: "marketing" as const, label: "Marketing emails", desc: "Product updates and news" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((n) => ({ ...n, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Account">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </DashboardCard>

      <DashboardCard title="Danger Zone" className="border-destructive/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="size-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
          </div>
          <Button variant="destructive" className="rounded-xl" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </DashboardCard>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description="This action is irreversible. All your data will be permanently deleted."
        variant="destructive"
        confirmLabel="Delete Account"
        isLoading={deleteAccount.isPending}
        onConfirm={() => deleteAccount.mutate(undefined, { onSuccess: () => setDeleteOpen(false) })}
      />
    </div>
  );
}
