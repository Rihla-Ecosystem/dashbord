import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartCard({
  title,
  description,
  children,
  action,
  className,
  height = 300,
}: ChartCardProps) {
  return (
    <DashboardCard
      title={title}
      description={description}
      action={action}
      className={className}
      contentClassName="pb-2"
    >
      <div style={{ height }} className={cn("w-full")}>
        {children}
      </div>
    </DashboardCard>
  );
}
