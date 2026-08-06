"use client";

import {
  BookOpen,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type LocationTab =
  | "general"
  | "location"
  | "tourism"
  | "safety"
  | "nearby"
  | "media"
  | "ai"
  | "history";

export interface LocationTabDef {
  id: LocationTab;
  label: string;
  icon: LucideIcon;
}

export const LOCATION_TABS: LocationTabDef[] = [
  { id: "general", label: "General", icon: Info },
  { id: "location", label: "Location", icon: MapPin },
  { id: "tourism", label: "Tourism", icon: BookOpen },
  { id: "safety", label: "Safety", icon: ShieldCheck },
  { id: "nearby", label: "Nearby", icon: UtensilsCrossed },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "history", label: "History", icon: History },
];
