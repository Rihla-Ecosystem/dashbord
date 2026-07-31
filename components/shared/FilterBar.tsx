"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  children,
  onClear,
  hasActiveFilters,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm",
        className
      )}
    >
      {children}
      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto gap-1">
          <X className="size-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
