import { Badge } from "@/components/ui/badge";
import { categoryMeta, GEO_STATUS_META, riskMeta, severityMeta } from "@/constants/geocontext";
import type { GeoLocation, RiskLevel, WarningSeverity } from "@/types/geocontext";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: GeoLocation["status"]; className?: string }) {
  const meta = GEO_STATUS_META[status];
  return (
    <Badge
      className={cn("rounded-full", className)}
      style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: GeoLocation["category"] }) {
  const meta = categoryMeta(category);
  return (
    <Badge className="rounded-full capitalize" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
      {meta.label}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: WarningSeverity }) {
  const meta = severityMeta(severity);
  return (
    <Badge className="rounded-full capitalize" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
      {meta.label}
    </Badge>
  );
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = riskMeta(level);
  return (
    <Badge
      className={cn("rounded-full uppercase", className)}
      style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
    >
      {meta.label}
    </Badge>
  );
}

export function LayerPill({ label, tone: t }: { label: string; tone: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", t)}>{label}</span>;
}
