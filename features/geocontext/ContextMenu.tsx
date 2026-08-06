"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  key: string;
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  children?: ContextMenuItem[];
  divider?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

type Dir = "r" | "l";

interface ContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
  align?: Dir;
}

/**
 * Lightweight portal-based context menu positioned at the pointer location.
 * Closes on outside click, Esc, scroll or window blur.
 */
export function ContextMenu({ state, onClose, align = "r" }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  const pos = useMemo(() => {
    if (!state) return null;
    const pad = 8;
    const menuWidth = 220;
    const menuHeight = Math.min(420, state.items.length * 34 + 16);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = state.x;
    let y = state.y;
    let dir: Dir = align;
    if (align === "r" && x + menuWidth + pad > vw) {
      dir = "l";
      x = Math.max(pad, x - menuWidth);
    } else if (align === "l" && x - menuWidth < 0) {
      dir = "r";
      x = pad;
    }
    if (x + menuWidth > vw) x = Math.max(pad, vw - menuWidth - pad);
    if (y + menuHeight > vh) y = Math.max(pad, vh - menuHeight - pad);
    return { x, y, dir };
  }, [state, align]);

  useEffect(() => {
    if (!state) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("blur", close);
    };
  }, [state, onClose]);

  if (!state || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      className="font-sans z-[1300] w-[220px] rounded-xl border border-border/60 bg-popover p-1.5 text-sm text-popover-foreground shadow-xl shadow-black/10 dark:shadow-black/40 animate-in fade-in-0 zoom-in-95"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        transformOrigin: pos.dir === "l" ? "top right" : "top left",
      }}
    >
      {state.items.map((item) => {
        if (item.divider) {
          return <div key={item.key} role="separator" className="my-1 h-px bg-border" />;
        }
        if (item.children && item.children.length) {
          return <SubMenu key={item.key} item={item} onOpenSelect={onClose} />;
        }
        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect?.();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors",
              item.disabled
                ? "cursor-not-allowed text-muted-foreground/50"
                : "hover:bg-accent hover:text-accent-foreground",
              item.destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            {item.icon && <span className="flex size-4 items-center justify-center">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <kbd className="rounded border border-border/60 bg-muted/50 px-1 text-[10px] text-muted-foreground">
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function SubMenu({ item, onOpenSelect }: { item: ContextMenuItem; onOpenSelect: () => void }) {
  return (
    <span className="w-full">
      <div className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-1.5">
        {item.icon && <span className="size-4">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
        <svg viewBox="0 0 20 20" className="size-3.5 text-muted-foreground" fill="currentColor">
          <path fillRule="evenodd" d="M6 4l6 6-6 6V4z" />
        </svg>
      </div>
      <div className="ml-3 border-l border-border/60 pl-2">
        {item.children?.map((child) => (
          <button
            key={child.key}
            type="button"
            onClick={() => {
              onOpenSelect();
              child.onSelect?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
          >
            {child.icon && <span className="size-4">{child.icon}</span>}
            <span className="flex-1">{child.label}</span>
          </button>
        ))}
      </div>
    </span>
  );
}

export function useContextMenuState() {
  return useState<ContextMenuState | null>(null);
}