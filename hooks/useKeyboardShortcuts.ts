"use client";

import { useEffect, useRef } from "react";

export interface Shortcut {
  /** Key combination, e.g. "1", "g+m", "Escape", "shift+f". Modifiers first. */
  keys: string;
  handler: () => void;
  /** Skip when the event target is an editable field. */
  ignoreEditable?: boolean;
  /** Prevents the browser default for this shortcut. */
  preventDefault?: boolean;
}

function normalize(e: KeyboardEvent): string {
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push("mod");
  if (e.shiftKey) mods.push("shift");
  if (e.altKey) mods.push("alt");
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const parts = [...mods, e.key !== key ? key : key];
  return parts.length > 1 ? parts.join("+") : e.key.toLowerCase() === " " ? "space" : e.key.toLowerCase();
}

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  onShortcut?: (keys: string) => void;
}

/**
 * Registers global keyboard shortcuts. Returns a stable map of keys -> handler used
 * to render a shortcut-legend in the UI.
 */
export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: KeyboardShortcutsOptions = {}
) {
  const enabled = options.enabled ?? true;
  const onShortcut = options.onShortcut;
  const handlersRef = useRef(shortcuts);
  const onShortcutRef = useRef(onShortcut);

  useEffect(() => {
    handlersRef.current = shortcuts;
  }, [shortcuts]);
  useEffect(() => {
    onShortcutRef.current = onShortcut;
  }, [onShortcut]);

  useEffect(() => {
    if (!enabled) return;

    const map = new Map<string, Shortcut>();
    handlersRef.current.forEach((s) => map.set(s.keys.toLowerCase(), s));

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const combo = normalize(e);
      const shortcut = map.get(combo) ?? map.get(combo.split("+").reverse().join("+"));
      if (!shortcut) return;
      if (shortcut.ignoreEditable && isEditable(e.target)) return;
      if (shortcut.preventDefault) e.preventDefault();
      e.stopPropagation();
      shortcut.handler();
      onShortcutRef.current?.(shortcut.keys);
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [enabled]);

  return shortcuts;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function isModLike(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}