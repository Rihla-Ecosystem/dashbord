"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useNotificationCategories, useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/useNotifications";
import { getErrorMessage } from "@/utils";

const RULE_LABELS: Record<string, string> = {
  entering_restricted_area: "Entering restricted area",
  approaching_restricted_area: "Approaching restricted area",
  photography_restricted: "Photography restricted",
  entering_dangerous_area: "Entering dangerous area",
  nearby_emergency: "Nearby emergency",
  nearby_tourist_attraction: "Nearby tourist attraction",
  nearby_historical_site: "Nearby historical site",
  severe_weather: "Severe weather",
  heavy_traffic: "Heavy traffic",
};

export function NotificationSettingsPanel() {
  const settingsQuery = useNotificationSettings();
  const categoriesQuery = useNotificationCategories();
  const updateSettings = useUpdateNotificationSettings();

  const settings = settingsQuery.data;

  const defaults = useMemo(
    () => ({
      cooldownRules: settings?.cooldownRules ?? {},
      movementThresholdKm: settings?.movementThresholdKm ?? 1,
      realtimeEnabled: settings?.realtimeEnabled ?? true,
    }),
    [settings]
  );

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (settingsQuery.error) {
    return <ErrorState title="Could not load settings" onRetry={() => settingsQuery.refetch()} />;
  }

  return (
    <SettingsForm
      key={JSON.stringify(defaults)}
      defaults={defaults}
      categories={categoriesQuery.data?.categories ?? []}
      isSaving={updateSettings.isPending}
      onSave={(patch) =>
        updateSettings.mutate(patch, {
          onSuccess: () => toast.success("Notification settings saved"),
          onError: (err) => toast.error(getErrorMessage(err)),
        })
      }
    />
  );
}

function SettingsForm({
  defaults,
  categories,
  isSaving,
  onSave,
}: {
  defaults: { cooldownRules: Record<string, string>; movementThresholdKm: number; realtimeEnabled: boolean };
  categories: string[];
  isSaving: boolean;
  onSave: (patch: { cooldownRules: Record<string, string>; movementThresholdKm: number; realtimeEnabled: boolean }) => void;
}) {
  const [cooldown, setCooldown] = useState<Record<string, string>>(defaults.cooldownRules);
  const [threshold, setThreshold] = useState<number>(defaults.movementThresholdKm);
  const [realtime, setRealtime] = useState(defaults.realtimeEnabled);
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    onSave({ cooldownRules: cooldown, movementThresholdKm: threshold, realtimeEnabled: realtime });
    setDirty(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Preferences */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Notification preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Realtime delivery</p>
              <p className="text-xs text-muted-foreground">Push notifications live over the SSE stream.</p>
            </div>
            <Switch checked={realtime} onCheckedChange={(v) => { setRealtime(v); setDirty(true); }} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Movement threshold</p>
              <p className="text-xs text-muted-foreground">Minimum travel distance (km) before a new context report is generated.</p>
            </div>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={threshold}
              onChange={(e) => { setThreshold(Number(e.target.value)); setDirty(true); }}
              className="w-24 text-right"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Notification categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium">
              {c}
            </span>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories loaded.</p>}
        </div>
      </div>

      {/* Cooldown rules */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Cooldown rules</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          How long (ms, s, m, h, d) each rule waits before sending another notification of the same type.
        </p>
        <div className="space-y-2">
          {Object.keys(RULE_LABELS).map((rule) => (
            <div key={rule} className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-2">
              <span className="text-sm">{RULE_LABELS[rule]}</span>
              <Input
                value={cooldown[rule] ?? ""}
                onChange={(e) => { setCooldown((c) => ({ ...c, [rule]: e.target.value })); setDirty(true); }}
                className="w-28 text-right font-mono"
                placeholder="30m"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || isSaving}>
          <Save className="size-4" /> {isSaving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
