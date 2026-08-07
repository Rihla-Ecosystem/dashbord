"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Globe2,
  HeartPulse,
  Link2,
  MapPin,
  Phone,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge, RiskBadge, SeverityBadge, StatusBadge } from "../badges";
import { nearbyServiceMeta, NEARBY_SERVICE_TYPES } from "@/constants/geocontext";
import { useAddNearbyService, useDeleteGeoWarning, useDeleteNearbyService, useWeather } from "@/hooks/useGeocontext";
import { formatDate, formatRelative, getErrorMessage } from "@/utils";
import { weatherDescription } from "../weather";
import { formatCoordinate } from "../geoUtils";
import type { LocationTab } from "./tabs";
import type { GeoLocation, LocationWarning, NearbyService, NearbyServiceType } from "@/types/geocontext";
import { cn } from "@/lib/utils";

function SafetyRing({ score }: { score: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold" style={{ color }}>{score}</p>
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">safety</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function WarningRow({ warning, locationId, canEdit }: { warning: LocationWarning; locationId: string; canEdit: boolean }) {
  const deleteMutation = useDeleteGeoWarning(locationId, warning.id);
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{warning.title}</p>
            <SeverityBadge severity={warning.severity} />
            {warning.active ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Inactive</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{warning.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {warning.category.replace("_", " ")} · added {formatRelative(warning.createdAt)}
            {warning.expiresAt ? ` · expires ${formatDate(warning.expiresAt)}` : ""}
          </p>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => deleteMutation.mutate(undefined, { onSuccess: () => toast.success("Warning removed") })}
            disabled={deleteMutation.isPending}
            aria-label="Remove warning"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NearbyRow({ service, canEdit }: { service: NearbyService; canEdit: boolean }) {
  const meta = nearbyServiceMeta(service.type);
  const deleteMutation = useDeleteNearbyService(service.locationId, service.id);
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
          <MapPin className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{service.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-semibold">{service.distanceKm.toFixed(1)} km</p>
          {service.rating !== undefined && <p className="text-xs text-muted-foreground">★ {service.rating}</p>}
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => deleteMutation.mutate(undefined, { onSuccess: () => toast.success("Service removed") })}
            disabled={deleteMutation.isPending}
            aria-label="Remove service"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NearbyEditor({ location, canEdit }: { location: GeoLocation; canEdit: boolean }) {
  const [showAddService, setShowAddService] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceType, setServiceType] = useState<NearbyServiceType>("hospital");
  const [serviceDistance, setServiceDistance] = useState("0.5");
  const addServiceMutation = useAddNearbyService(location.id);

  const addService = () => {
    const distance = Number.parseFloat(serviceDistance);
    if (!serviceName.trim() || Number.isNaN(distance) || distance < 0) {
      toast.error("Enter a valid name and distance");
      return;
    }
    addServiceMutation.mutate(
      { name: serviceName.trim(), type: serviceType, distanceKm: distance },
      {
        onSuccess: () => {
          toast.success(`"${serviceName.trim()}" added to nearby services`);
          setServiceName("");
          setServiceDistance("0.5");
          setShowAddService(false);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  // Group nearby services into the familiar categories.
  const groups = useMemo(() => {
    const wanted: NearbyServiceType[] = ["hospital", "police_station", "hotel", "restaurant", "bus_stop"];
    const out: { type: NearbyServiceType; services: NearbyService[] }[] = [];
    wanted.forEach((t) => {
      const services = location.nearby.filter((s) => s.type === t);
      if (services.length) out.push({ type: t, services });
    });
    const rest = location.nearby.filter((s) => !wanted.includes(s.type));
    if (rest.length) out.push({ type: "tourist_attraction" as NearbyServiceType, services: rest });
    return out;
  }, [location.nearby]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Nearby services ({location.nearby.length})</h4>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setShowAddService((v) => !v)}>
            <Plus className="size-4" /> Add service
          </Button>
        )}
      </div>

      {showAddService && (
        <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
          <input
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="Service name"
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring"
          />
          <div className="flex items-center gap-2">
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as NearbyServiceType)}
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring"
            >
              {NEARBY_SERVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              value={serviceDistance}
              onChange={(e) => setServiceDistance(e.target.value)}
              type="number"
              min="0"
              step="0.1"
              placeholder="km"
              className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring"
            />
            <Button size="sm" onClick={addService} disabled={addServiceMutation.isPending}>
              {addServiceMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {location.nearby.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No nearby services recorded.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.type}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {nearbyServiceMeta(group.type).label}s
          </p>
          <div className="space-y-1.5">
            {group.services.map((service) => (
              <NearbyRow key={service.id} service={service} canEdit={canEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LocationViewProps {
  location: GeoLocation;
  tab: LocationTab;
  canEdit: boolean;
  activityEvents?: { id: string; action: string; actor: string; createdAt: string }[];
}

export function LocationViewTabs({ location, tab, canEdit, activityEvents = [] }: LocationViewProps) {
  const weatherQuery = useWeather(location.lat, location.lng);

  const activityTimeline = useMemo(() => {
    if (activityEvents.length) return activityEvents;
    return (location.auditLog ?? []).map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor: entry.actor,
      createdAt: entry.createdAt,
    }));
  }, [activityEvents, location.auditLog]);

  if (tab === "general") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{location.description}</p>
        {location.aiSummary && (
          <div className="flex items-start gap-2 rounded-xl bg-violet-500/5 p-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-500" />
            <p className="text-sm text-muted-foreground">{location.aiSummary}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {location.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full capitalize">{tag}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={location.status} />
          <CategoryBadge category={location.category} />
          <RiskBadge level={location.riskLevel} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{location.visibility}</span>
        </div>
        <div className="grid gap-2 rounded-xl border border-border/50 p-3 text-sm">
          <p className="flex items-center gap-2"><Globe2 className="size-4 text-muted-foreground" /> {location.address}</p>
          {location.contact.phone && <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {location.contact.phone}</p>}
          {location.contact.website && (
            <a href={location.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <ExternalLink className="size-4" /> Website
            </a>
          )}
          {location.contact.googleMapsUrl && (
            <a href={location.contact.googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <MapPin className="size-4" /> Google Maps
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Fact icon={<Calendar className="size-4" />} label="Created" value={formatDate(location.createdAt)} />
          <Fact icon={<Clock className="size-4" />} label="Updated" value={formatRelative(location.updatedAt)} />
        </div>
      </div>
    );
  }

  if (tab === "location") {
    return (
      <div className="space-y-4">
        <div className="grid gap-2 rounded-xl border border-border/50 p-3 text-sm">
          <p className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Latitude</span><span className="font-medium tabular-nums">{formatCoordinate(location.lat)}</span></p>
          <p className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Longitude</span><span className="font-medium tabular-nums">{formatCoordinate(location.lng)}</span></p>
          {location.polygon && location.polygon.length >= 3 && (
            <p className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Geometry</span><span className="font-medium">{location.polygon.length} vertices</span></p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Fact icon={<MapPin className="size-4" />} label="Governorate" value={location.governorate} />
          <Fact icon={<MapPin className="size-4" />} label="City" value={location.city} />
          <Fact icon={<Globe2 className="size-4" />} label="Country" value={location.country} />
          <Fact icon={<MapPin className="size-4" />} label="Address" value={location.address} />
        </div>
      </div>
    );
  }

  if (tab === "tourism") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Fact icon={<Calendar className="size-4" />} label="Best time" value={location.bestTimeToVisit || "—"} />
          <Fact icon={<Clock className="size-4" />} label="Duration" value={location.estimatedDurationMinutes ? `${location.estimatedDurationMinutes} min` : "—"} />
        </div>
        <InfoBlock label="UNESCO status" value={location.unescoStatus} />
        <InfoBlock label="History" value={location.history} />
        <InfoBlock label="Cultural information" value={location.culturalInfo} />
        <InfoBlock label="Tourist description" value={location.touristDescription} />
        <InfoBlock label="Accessibility" value={location.accessibility} />
        <InfoBlock label="Transportation tips" value={location.transportationTips} />
        <InfoBlock label="Local tips" value={location.localTips} />
        <div className="grid grid-cols-2 gap-3">
          <Fact icon={<Clock className="size-4" />} label="Opening hours" value={location.openingHours.note || "See location"} />
          <Fact
            icon={<Calendar className="size-4" />}
            label="Ticket"
            value={location.ticket.free ? "Free entry" : location.ticket.foreignPrice !== undefined ? `${location.ticket.foreignPrice} EGP (foreign)` : "—"}
          />
        </div>
        {location.interestingFacts.length > 0 && (
          <InfoBlock label="Interesting facts" value={location.interestingFacts.join(" · ")} />
        )}
      </div>
    );
  }

  if (tab === "safety") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
          <SafetyRing score={location.safetyScore} />
          <div className="text-sm">
            <p>Risk: <RiskBadge level={location.riskLevel} /></p>
            <p className="mt-1 text-xs text-muted-foreground">Composite safety score from warnings, category and review signals.</p>
          </div>
        </div>
        <InfoBlock label="Photography rules" value={location.photographyRules} />
        <InfoBlock label="Drone rules" value={location.droneRules} />
        <InfoBlock label="Local laws" value={location.localLaws} />
        <InfoBlock label="Emergency instructions" value={location.emergencyInstructions} />
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            <HeartPulse className="size-4" />
            Emergency contacts
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> Police: 122</p>
            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> Ambulance: 123</p>
            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> Tourist Police: 126</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Active warnings</p>
          {location.warnings.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No warnings for this location.
            </p>
          )}
          {location.warnings.map((warning) => (
            <WarningRow key={warning.id} warning={warning} locationId={location.id} canEdit={canEdit} />
          ))}
        </div>
      </div>
    );
  }

  if (tab === "nearby") {
    return <NearbyEditor location={location} canEdit={canEdit} />;
  }

  if (tab === "media") {
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><span className="size-2 rounded-full bg-teal-500" /> Images</p>
          {location.images.length ? (
            <div className="grid grid-cols-3 gap-2">
              {location.images.map((img) => (
                // User-generated media from an external CDN; next/image would need a
                // remote pattern and dynamic width/height, so a plain <img> is used.
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={img.caption ?? location.nameEn} className="aspect-video w-full rounded-lg object-cover" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No images uploaded yet.</p>
          )}
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><PlayCircle className="size-4 text-muted-foreground" /> Videos</p>
          {location.videos.some((v) => v.url) ? (
            <div className="flex flex-wrap gap-2">
              {location.videos.filter((v) => v.url).map((v) => (
                <span key={v.id} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs">
                  <PlayCircle className="size-3.5" /> {v.title ?? "Video"}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No videos uploaded yet.</p>
          )}
        </div>
        {location.documents.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><FileText className="size-4 text-muted-foreground" /> Documents</p>
            <div className="space-y-1.5">
              {location.documents.map((doc) => (
                <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-muted/30">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{doc.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        {location.attachments.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><Globe2 className="size-4 text-muted-foreground" /> Attachments</p>
            <div className="space-y-1.5">
              {location.attachments.map((att) => (
                <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-muted/30">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{att.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        {location.externalLinks.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><Link2 className="size-4 text-muted-foreground" /> External links</p>
            <div className="space-y-1.5">
              {location.externalLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm text-primary hover:bg-muted/30 hover:underline">
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        {(location.documents.length + location.attachments.length + location.externalLinks.length) === 0 && location.images.length === 0 && !location.videos.some((v) => v.url) && (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No media added yet.
          </p>
        )}
      </div>
    );
  }

  if (tab === "ai") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
            <Sparkles className="size-4" /> AI Summary
          </p>
          {location.aiSummary ? (
            <p className="mt-2 text-sm text-muted-foreground">{location.aiSummary}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No AI summary generated for this location yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-border/50 p-4">
          <p className="text-sm font-semibold">Safety assessment</p>
          <div className="mt-2 flex items-center gap-4">
            <SafetyRing score={location.safetyScore} />
            <div className="text-sm">
              <p>Risk: <RiskBadge level={location.riskLevel} /></p>
              <p className="mt-1 text-xs text-muted-foreground">Composite safety score from warnings, category and review signals.</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 p-4">
          <p className="text-sm font-semibold">Live weather</p>
          {weatherQuery.isLoading ? (
            <p className="mt-1 text-xs text-muted-foreground">Loading…</p>
          ) : weatherQuery.data ? (
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="text-lg font-bold">{weatherQuery.data.temperature.toFixed(1)}°C</span>
              <span className="text-muted-foreground">{weatherDescription(weatherQuery.data.weatherCode)}</span>
              <span className="text-xs text-muted-foreground">Wind {weatherQuery.data.windSpeed.toFixed(1)} km/h</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Weather unavailable.</p>
          )}
        </div>
      </div>
    );
  }

  if (tab === "history") {
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Version history (v{location.version})</p>
          <div className="space-y-2">
            {location.versions.length ? location.versions.map((version) => (
              <div key={version.version} className="rounded-xl border border-border/50 p-3">
                <p className="text-sm font-semibold">Version {version.version}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(version.createdAt)} by {version.changedBy}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                  {version.changes.map((change) => <li key={change}>{change}</li>)}
                </ul>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No version history recorded.</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Audit log</p>
          <div className="space-y-2">
            {location.auditLog.length ? location.auditLog.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <p className="text-sm">{entry.action.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(entry.createdAt)} · {entry.actor}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <PlayCircle className="size-4 text-muted-foreground" /> Activity timeline
          </p>
          {activityTimeline.length ? (
            <ol className={cn("relative ml-2 space-y-3 border-l border-border/60 pl-4")}>
              {activityTimeline.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                  <p className="text-sm">{entry.action.replace(/[_-]/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{entry.actor} · {formatRelative(entry.createdAt)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No activity recorded for this location.</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
