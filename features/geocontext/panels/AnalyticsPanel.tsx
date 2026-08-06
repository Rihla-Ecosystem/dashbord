"use client";

import { CategoryDonutChart, CategoryLegend, CoverageGauge, GeoStatsGrid, RiskDistribution, SeverityBarChart, TopUpdatedList } from "../charts";
import { useGeoWorkspace } from "../workspace-context";

export function AnalyticsPanel() {
  const { analytics, isLocationsLoading } = useGeoWorkspace();
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/50 px-4 py-2.5">
        <h3 className="text-sm font-semibold">Analytics</h3>
        <p className="text-xs text-muted-foreground">Live statistics computed by the GeoContext service</p>
      </div>
      <div className="space-y-4 p-4">
        <GeoStatsGrid analytics={analytics} isLoading={isLocationsLoading} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryDonutChart analytics={analytics} isLoading={isLocationsLoading} />
          <CoverageGauge analytics={analytics} isLoading={isLocationsLoading} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SeverityBarChart analytics={analytics} isLoading={isLocationsLoading} />
          <RiskDistribution analytics={analytics} isLoading={isLocationsLoading} />
        </div>
        <CategoryLegend analytics={analytics} isLoading={isLocationsLoading} />
        <TopUpdatedList analytics={analytics} isLoading={isLocationsLoading} />
      </div>
    </div>
  );
}