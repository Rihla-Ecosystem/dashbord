"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  ChevronDown,
  Crosshair,
  Hotel,
  Info,
  Landmark,
  ListChecks,
  MapPin,
  Phone,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useContextReport } from "@/hooks/useNotifications";
import { formatDateTime } from "@/utils";
import type { ContextReportData, ContextReportNearbyItem } from "@/types/notifications";

const RISK_COLOR: Record<string, string> = {
  info: "bg-sky-500/15 text-sky-600",
  low: "bg-emerald-500/15 text-emerald-600",
  moderate: "bg-amber-500/15 text-amber-600",
  warning: "bg-orange-500/15 text-orange-600",
  critical: "bg-red-500/15 text-red-600",
};

interface Props {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContextReportDetailModal({ reportId, open, onOpenChange }: Props) {
  const { data, isLoading, error, refetch } = useContextReport(reportId);

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="max-h-[92vh] overflow-hidden p-0">
        <ModalHeader className="border-b">
          <ModalTitle className="flex items-center gap-2">
            <Crosshair className="size-4" /> Context Intelligence Report
          </ModalTitle>
        </ModalHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-5">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {error && (
            <div className="p-5">
              <ErrorState
                title="Could not load report"
                message="The context report could not be fetched."
                onRetry={() => refetch()}
              />
            </div>
          )}
          {data && <ReportContent report={data.report ?? null} createdAt={data.createdAt} areaName={data.areaName} lat={data.lat} lng={data.lng} notifications={data.notifications ?? []} summary={data.summary} />}
        </div>
      </ModalContent>
    </Modal>
  );
}

function Section({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">{children}</div>}
    </section>
  );
}

function NearbyList({ items, empty }: { items?: ContextReportNearbyItem[]; empty: string }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={`${item.name}-${i}`} className="flex items-start justify-between gap-3">
          <span className="font-medium text-foreground">{item.name}</span>
          {item.distanceMeters != null && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.distanceMeters < 1000
                ? `${Math.round(item.distanceMeters)} m`
                : `${(item.distanceMeters / 1000).toFixed(1)} km`}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function StringList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">No items reported.</p>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReportContent({
  report,
  createdAt,
  areaName,
  lat,
  lng,
  notifications,
  summary,
}: {
  report: ContextReportData | null;
  createdAt: string;
  areaName: string | null;
  lat: number | null;
  lng: number | null;
  notifications: { id: string; title: string; priority: string }[];
  summary: string | null;
}) {
  const riskLevel = report?.riskLevel ?? "info";
  const sections = useMemo(() => {
    const ai = report?.aiSummary;
    return [
      {
        icon: <Info className="size-4 text-sky-500" />,
        title: "Executive summary",
        body: <p>{ai?.executiveSummary ?? summary ?? "Not available."}</p>,
        open: true,
      },
      {
        icon: <MapPin className="size-4 text-emerald-500" />,
        title: "Current situation",
        body: <p>{ai?.currentSituation ?? "Not available."}</p>,
      },
      {
        icon: <ShieldCheck className="size-4 text-emerald-600" />,
        title: "Safety assessment",
        body: <p>{ai?.safetyAssessment ?? "Not available."}</p>,
      },
      {
        icon: <AlertTriangle className="size-4 text-amber-500" />,
        title: "Risk explanation",
        body: (
          <div className="space-y-2">
            <p>
              Risk level: <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLOR[riskLevel] ?? RISK_COLOR.info}`}>{riskLevel}</span>{" "}
              {report?.safetyScore != null && <span className="text-muted-foreground">· Safety score {report.safetyScore}/100</span>}
            </p>
            <p>{ai?.riskAnalysis ?? "Not available."}</p>
          </div>
        ),
      },
      {
        icon: <Landmark className="size-4 text-teal-500" />,
        title: "Historical information",
        body: <p>{ai?.historicalSummary ?? report?.historicalInformation ?? "Not available."}</p>,
      },
      {
        icon: <Utensils className="size-4 text-orange-500" />,
        title: "Nearby restaurants",
        body: <NearbyList items={report?.nearbyRestaurants} empty="No restaurants reported nearby." />,
      },
      {
        icon: <Hotel className="size-4 text-violet-500" />,
        title: "Nearby hotels",
        body: <NearbyList items={report?.nearbyHotels} empty="No hotels reported nearby." />,
      },
      {
        icon: <Crosshair className="size-4 text-rose-500" />,
        title: "Nearby attractions",
        body: <NearbyList items={report?.nearbyAttractions} empty="No attractions reported nearby." />,
      },
      {
        icon: <Activity className="size-4 text-red-500" />,
        title: "Nearby hospitals",
        body: <NearbyList items={report?.nearbyHospitals} empty="No hospitals reported nearby." />,
      },
      {
        icon: <ShieldCheck className="size-4 text-blue-500" />,
        title: "Nearby police stations",
        body: <NearbyList items={report?.nearbyPoliceStations} empty="No police stations reported nearby." />,
      },
      {
        icon: <Building2 className="size-4 text-slate-500" />,
        title: "Nearby transportation",
        body: <NearbyList items={report?.nearbyTransportation} empty="No transport reported nearby." />,
      },
      {
        icon: <Banknote className="size-4 text-green-600" />,
        title: "Things to avoid",
        body: <StringList items={report?.thingsToAvoid} />,
      },
      {
        icon: <ListChecks className="size-4 text-teal-600" />,
        title: "Recommended actions",
        body: <StringList items={report?.recommendations} />,
      },
      {
        icon: <Info className="size-4 text-sky-600" />,
        title: "Tourist tips",
        body: <StringList items={report?.touristTips} />,
      },
      {
        icon: <Info className="size-4 text-indigo-500" />,
        title: "Interesting facts",
        body: <StringList items={report?.aiSummary?.interestingFacts} />,
      },
      {
        icon: <Activity className="size-4 text-fuchsia-500" />,
        title: "AI recommendations",
        body: <StringList items={report?.aiSummary?.personalizedRecommendations} />,
      },
      {
        icon: <Phone className="size-4 text-cyan-600" />,
        title: "Emergency contacts",
        body: report?.emergencyContacts?.length ? (
          <ul className="space-y-1.5">
            {report.emergencyContacts.map((c) => (
              <li key={c.phone} className="flex items-center justify-between gap-3">
                <span className="capitalize text-foreground">{c.name}</span>
                <span className="font-semibold tabular-nums text-foreground">{c.phone}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Not available.</p>
        ),
      },
    ];
  }, [report, summary, riskLevel]);

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header card */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted/40 p-4">
        <div>
          <p className="text-base font-semibold">{areaName ?? "Unknown area"}</p>
          {lat != null && lng != null && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {lat.toFixed(4)}, {lng.toFixed(4)} · {formatDateTime(createdAt)}
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {notifications.map((n) => (
              <Badge key={n.id} variant="outline">
                {n.title}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {sections.map((s) => (
        <Section key={s.title} icon={s.icon} title={s.title} defaultOpen={s.open}>
          {s.body}
        </Section>
      ))}

      {!report && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          <Info className="size-4" /> This report has no stored analysis data.
        </div>
      )}
    </div>
  );
}