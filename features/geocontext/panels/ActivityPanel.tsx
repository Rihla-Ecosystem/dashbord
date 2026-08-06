"use client";

import { ActivityFeed } from "../ActivityFeed";
import { useGeoWorkspace } from "../workspace-context";

export function ActivityPanel() {
  const { activity, isLocationsLoading } = useGeoWorkspace();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 px-4 py-2.5">
        <h3 className="text-sm font-semibold">Activity feed</h3>
        <p className="text-xs text-muted-foreground">All actions performed in GeoContext</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ActivityFeed events={activity} isLoading={isLocationsLoading} className="h-full border-0 bg-transparent p-0 shadow-none" />
      </div>
    </div>
  );
}