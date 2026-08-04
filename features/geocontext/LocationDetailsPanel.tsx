"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
  Globe2,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  Phone,
  PlayCircle,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge, RiskBadge, SeverityBadge, StatusBadge } from "./badges";
import { nearbyServiceMeta } from "@/constants/geocontext";
import { useDeleteGeoWarning, useSetGeoLocationStatus } from "@/hooks/useGeocontext";
import { formatDate, formatRelative } from "@/utils";
import { getErrorMessage } from "@/utils";
import type { GeoLocation } from "@/types/geocontext";
import { cn } from "@/lib/utils";

type Tab = "profile" | "tourism" | "warnings" | "nearby" | "history";

interface LocationDetailsPanelProps {
  location: GeoLocation;
  onEdit: () => void;
  onAddWarning: () => void;
  onDelete: () => void;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

function SafetyRing({ score }: { score: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="relative flex size-24 items-center justify-center">
      <svg className="size-24 -rotate-90" viewBox="0 0 80 80">
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
        <p className="text-2xl font-bold" style={{ color }}>
          {score}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">safety</p>
      </div>
    </div>
  );
}

export function LocationDetailsPanel({
  location,
  onEdit,
  onAddWarning,
  onDelete,
  onClose,
  canEdit,
  canDelete,
}: LocationDetailsPanelProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusMutation = useSetGeoLocationStatus(location.id);
  const deleteWarningMutation = useDeleteGeoWarning(location.id, "");

  const toggleStatus = () => {
    const next = location.status === "published" ? "unpublished" : "published";
    statusMutation.mutate(next, {
      onSuccess: () => toast.success(`"${location.nameEn}" ${next === "published" ? "published" : "unpublished"}`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const removeWarning = () => {
    deleteWarningMutation.mutate(undefined, {
      onSuccess: () => toast.success("Warning removed"),
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <Info className="size-3.5" /> },
    { id: "tourism", label: "Tourism", icon: <BookOpen className="size-3.5" /> },
    { id: "warnings", label: `Warnings (${location.warnings.length})`, icon: <ShieldAlert className="size-3.5" /> },
    { id: "nearby", label: "Nearby", icon: <MapPin className="size-3.5" /> },
    { id: "history", label: "History", icon: <History className="size-3.5" /> },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold">{location.nameEn}</h3>
            <StatusBadge status={location.status} />
          </div>
          <p className="text-sm text-muted-foreground">{location.nameAr}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <CategoryBadge category={location.category} />
            <RiskBadge level={location.riskLevel} />
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 border-b border-border/50 bg-muted/20 px-4 py-3">
        <SafetyRing score={location.safetyScore} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{location.city}, {location.governorate}, {location.country}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={onEdit} disabled={!canEdit}>
              <Edit3 className="size-3.5" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={toggleStatus} disabled={!canEdit || statusMutation.isPending}>
              {location.status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button size="sm" variant="outline" onClick={onAddWarning} disabled={!canEdit}>
              <Plus className="size-3.5" />
              Warning
            </Button>
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border/50 px-4 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tab === "profile" && (
          <>
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
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <ImageIcon className="size-4 text-muted-foreground" />
                Gallery
              </p>
              {location.images.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {location.images.map((img) => (
                    <img key={img.id} src={img.url} alt={img.caption ?? location.nameEn} className="aspect-video w-full rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No images uploaded yet.</p>
              )}
              {location.videos.some((v) => v.url) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {location.videos.filter((v) => v.url).map((v) => (
                    <span key={v.id} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs">
                      <PlayCircle className="size-3.5" />
                      {v.title ?? "Video"}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2 rounded-xl border border-border/50 p-3 text-sm">
              <p className="flex items-center gap-2"><Globe2 className="size-4 text-muted-foreground" /> {location.address}</p>
              {location.contact.phone && (
                <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {location.contact.phone}</p>
              )}
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
          </>
        )}

        {tab === "tourism" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Fact icon={<Calendar className="size-4" />} label="Best time" value={location.bestTimeToVisit || "—"} />
              <Fact icon={<Clock className="size-4" />} label="Duration" value={location.estimatedDurationMinutes ? `${location.estimatedDurationMinutes} min` : "—"} />
            </div>
            {location.unescoStatus && <InfoBox label="UNESCO" value={location.unescoStatus} />}
            {location.history && <InfoBox label="History" value={location.history} />}
            {location.culturalInfo && <InfoBox label="Culture" value={location.culturalInfo} />}
            {location.touristDescription && <InfoBox label="For tourists" value={location.touristDescription} />}
            <InfoBox label="Photography rules" value={location.photographyRules} />
            <InfoBox label="Drone rules" value={location.droneRules} />
            {location.accessibility && <InfoBox label="Accessibility" value={location.accessibility} />}
            {location.transportationTips && <InfoBox label="Transport" value={location.transportationTips} />}
            {location.localTips && <InfoBox label="Local tips" value={location.localTips} />}
            {location.emergencyInstructions && <InfoBox label="Emergency" value={location.emergencyInstructions} />}
            {location.interestingFacts.length > 0 && (
              <InfoBox label="Interesting facts" value={location.interestingFacts.join(" · ")} />
            )}
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Ticket" value={
                location.ticket.free
                  ? "Free entry"
                  : location.ticket.foreignPrice !== undefined
                    ? `${location.ticket.foreignPrice} EGP (foreign)`
                    : "—"
              } />
              <InfoBox label="Opening hours" value={location.openingHours.note || "See location"} />
            </div>
          </>
        )}

        {tab === "warnings" && (
          <>
            <Button size="sm" variant="outline" className="w-full" onClick={onAddWarning} disabled={!canEdit}>
              <Plus className="size-4" />
              Add warning
            </Button>
            {location.warnings.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No warnings for this location.
              </p>
            )}
            {location.warnings.map((warning) => (
              <div key={warning.id} className="rounded-xl border border-border/50 p-3">
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
                    <Button variant="ghost" size="icon-xs" onClick={removeWarning} disabled={deleteWarningMutation.isPending} aria-label="Remove warning">
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "nearby" && (
          <div className="space-y-3">
            {location.nearby.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No nearby services recorded.
              </p>
            )}
            {location.nearby.map((service) => {
              const meta = nearbyServiceMeta(service.type);
              return (
                <div key={service.id} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium capitalize">{service.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{service.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{service.distanceKm.toFixed(1)} km</p>
                    {service.rating !== undefined && <p className="text-xs text-muted-foreground">★ {service.rating}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "history" && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Version history (v{location.version})</p>
              <div className="space-y-2">
                {location.versions.map((version) => (
                  <div key={version.version} className="rounded-xl border border-border/50 p-3">
                    <p className="text-sm font-semibold">Version {version.version}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(version.createdAt)} by {version.changedBy}</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                      {version.changes.map((change) => <li key={change}>{change}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Audit log</p>
              <div className="space-y-2">
                {location.auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-sm">{entry.action.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(entry.createdAt)} · {entry.actor}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <p className="text-base font-semibold">Delete this location?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{location.nameEn}&rdquo; will be removed from the geographic dataset. This action is audit-logged.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { setConfirmDelete(false); onDelete(); }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
