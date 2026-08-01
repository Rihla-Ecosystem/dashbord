"use client";

import { Cloud, Wind, Droplets, Sun, Leaf, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useEnvironment } from "@/hooks/useEnvironment";
import { formatDateTime } from "@/utils";
import type { PrayerTime } from "@/types";

export default function EnvironmentPage() {
  const { data, isLoading, error, refetch } = useEnvironment();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const { weather, airQuality, prayerTimes, location, updatedAt } = data!;

  const aqiColor =
    airQuality.aqi <= 50
      ? "text-emerald-500"
      : airQuality.aqi <= 100
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environment"
        description={location ? `Current conditions for ${location}` : "Weather, air quality & prayer times"}
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Weather" className="bg-gradient-to-br from-sky-500/5 to-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-500/10">
              <Sun className="size-8 text-sky-500" />
            </div>
            <div>
              <p className="text-4xl font-bold">{weather.temperature}°C</p>
              <p className="capitalize text-muted-foreground">{weather.description}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-background/50 p-2">
              <Wind className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="font-medium">{weather.windSpeed}</p>
              <p className="text-xs text-muted-foreground">km/h</p>
            </div>
            <div className="rounded-lg bg-background/50 p-2">
              <Droplets className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="font-medium">{weather.humidity}%</p>
              <p className="text-xs text-muted-foreground">Humidity</p>
            </div>
            <div className="rounded-lg bg-background/50 p-2">
              <Cloud className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="font-medium">{weather.feelsLike}°</p>
              <p className="text-xs text-muted-foreground">Feels like</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Air Quality" className="bg-gradient-to-br from-emerald-500/5 to-green-500/10">
          <div className="text-center">
            <p className={`text-5xl font-bold ${aqiColor}`}>{airQuality.aqi}</p>
            <p className="mt-1 font-medium">{airQuality.level}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <Leaf className="mx-auto mb-1 size-4 text-emerald-500" />
              <p className="font-medium">PM2.5</p>
              <p className="text-muted-foreground">{airQuality.pm25}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <Leaf className="mx-auto mb-1 size-4 text-emerald-500" />
              <p className="font-medium">PM10</p>
              <p className="text-muted-foreground">{airQuality.pm10}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Prayer Times" className="sm:col-span-2 xl:col-span-1">
          <div className="space-y-2">
            {prayerTimes.map((prayer: PrayerTime) => (
              <div
                key={prayer.name}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {prayer.name}
                </span>
                <span className="text-sm tabular-nums">{prayer.time}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Overview" className="sm:col-span-2 xl:col-span-1">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{location ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{formatDateTime(updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Air Quality</span>
              <span className={`font-medium ${aqiColor}`}>{airQuality.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conditions</span>
              <span className="font-medium capitalize">{weather.description}</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
