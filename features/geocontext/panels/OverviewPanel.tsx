"use client";

import { Activity } from "lucide-react";
import { ActivityFeed } from "../ActivityFeed";
import { CategoryDonutChart, CoverageGauge, GeoStatsGrid, RiskDistribution, SeverityBarChart, TopUpdatedList } from "../charts";
import { useGeoWorkspace } from "../workspace-context";

export function OverviewPanel() {
  const { analytics, activity, isLocationsLoading } = useGeoWorkspace();
  return (
    <div className="space-y-4 p-4">
      <GeoStatsGrid analytics={analytics} isLoading={isLocationsLoading} />
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryDonutChart analytics={analytics} isLoading={isLocationsLoading} />
          <CoverageGauge analytics={analytics} isLoading={isLocationsLoading} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SeverityBarChart analytics={analytics} isLoading={isLocationsLoading} />
          <RiskDistribution analytics={analytics} isLoading={isLocationsLoading} />
        </div>
        <TopUpdatedList analytics={analytics} isLoading={isLocationsLoading} />
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Recent activity</h3>
          </div>
          <ActivityFeed events={activity} isLoading={isLocationsLoading} className="h-[320px]" />
        </div>
      </div>
    </div>
  );
}