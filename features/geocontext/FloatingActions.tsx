"use client";

import { useState } from "react";
import {
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export interface FloatingAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  hidden?: boolean;
  onClick: () => void;
}

interface FloatingActionsProps {
  actions: FloatingAction[];
  /** Primary FAB colour variant. */
  variant?: "primary" | "destructive";
}

/** Floating action button cluster (bottom-right) for the GeoContext workspace. */
export function FloatingActions({ actions, variant = "primary" }: FloatingActionsProps) {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts([{ keys: "Escape", handler: () => setOpen(false) }], { enabled: open });

  const visible = actions.filter((a) => !a.hidden);

  return (
    <div className="pointer-events-none absolute bottom-4 right-3 z-[700] flex flex-col items-end gap-2">
      {open &&
        visible.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
            disabled={action.disabled}
            className={cn(
              "group pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/50 bg-background/95 py-2 pl-2.5 pr-3 text-sm font-medium shadow-lg backdrop-blur transition-all hover:bg-accent",
              action.active && "border-primary/40 text-primary",
              action.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className={cn("flex size-7 items-center justify-center rounded-xl", action.active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close quick actions" : "Quick actions"}
        aria-expanded={open}
        className={cn(
          "pointer-events-auto flex size-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all hover:scale-105 active:scale-95",
          variant === "destructive"
            ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30"
            : "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-emerald-500/30",
          open && "rotate-45"
        )}
      >
        {open ? <X className="size-5" /> : <Plus className="size-5" />}
      </button>
    </div>
  );
}