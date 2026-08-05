"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TextInput, TextAreaField, SelectField, type SelectOption } from "./form-fields";
import { LOCATION_CATEGORIES, EGYPT_CITIES, GOVERNORATES } from "@/constants/geocontext";
import { useCreateGeoLocation, useUpdateGeoLocation, useGovernorates } from "@/hooks/useGeocontext";
import { getErrorMessage } from "@/utils";
import { isValidCoordinate, type ReverseGeocodeResult } from "./geoUtils";
import type { GeoLocation, LocationInput, GeoVisibility } from "@/types/geocontext";
import { cn } from "@/lib/utils";

interface FormValues {
  nameAr: string;
  nameEn: string;
  description: string;
  category: string;
  governorate: string;
  city: string;
  country: string;
  address: string;
  lat: string;
  lng: string;
  tags: string;
  visibility: GeoVisibility;
  history: string;
  culturalInfo: string;
  touristDescription: string;
  bestTimeToVisit: string;
  estimatedDurationMinutes: string;
  accessibility: string;
  photographyRules: string;
  droneRules: string;
  transportationTips: string;
  localTips: string;
  emergencyInstructions: string;
  interestingFacts: string;
  unescoStatus: string;
  foreignPrice: string;
  egyptianPrice: string;
  free: boolean;
  openingHoursNote: string;
  phone: string;
  email: string;
  website: string;
  googleMapsUrl: string;
  images: string;
  localLaws: string;
  notes: string;
  documents: string;
  attachments: string;
  externalLinks: string;
  customMetadata: string;
}

const EMPTY: FormValues = {
  nameAr: "",
  nameEn: "",
  description: "",
  category: "",
  governorate: "Cairo",
  city: "",
  country: "Egypt",
  address: "",
  lat: "",
  lng: "",
  tags: "",
  visibility: "public",
  history: "",
  culturalInfo: "",
  touristDescription: "",
  bestTimeToVisit: "",
  estimatedDurationMinutes: "",
  accessibility: "",
  photographyRules: "",
  droneRules: "",
  transportationTips: "",
  localTips: "",
  emergencyInstructions: "",
  interestingFacts: "",
  unescoStatus: "",
  foreignPrice: "",
  egyptianPrice: "",
  free: false,
  openingHoursNote: "",
  phone: "",
  email: "",
  website: "",
  googleMapsUrl: "",
  images: "",
  localLaws: "",
  notes: "",
  documents: "",
  attachments: "",
  externalLinks: "",
  customMetadata: "",
};

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: GeoLocation | null;
  initialCoords?: { lat: number; lng: number } | null;
  reverse?: ReverseGeocodeResult | null;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitPairs(value: string): { title: string; url: string }[] {
  return splitLines(value).flatMap((line) => {
    const idx = line.indexOf("=");
    if (idx === -1) return [];
    const title = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    return title && url ? [{ title, url }] : [];
  });
}

function splitMetadata(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of splitLines(value)) {
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

function joinPairs(items: { title: string; url: string }[]): string {
  return items.map((item) => `${item.title} = ${item.url}`).join("\n");
}

function joinMetadata(items: Record<string, string>): string {
  return Object.entries(items)
    .map(([key, value]) => `${key} = ${value}`)
    .join("\n");
}

export function LocationFormDialog({ open, onOpenChange, location, initialCoords, reverse }: LocationFormDialogProps) {
  const isEdit = !!location;
  const [tab, setTab] = useState<"general" | "tourism" | "cms">("general");
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateGeoLocation();
  const updateMutation = useUpdateGeoLocation(location?.id ?? "");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && location) {
      setValues({
        nameAr: location.nameAr,
        nameEn: location.nameEn,
        description: location.description,
        category: location.category,
        governorate: location.governorate,
        city: location.city,
        country: location.country,
        address: location.address,
        lat: String(location.lat),
        lng: String(location.lng),
        tags: location.tags.join(", "),
        visibility: location.visibility,
        history: location.history,
        culturalInfo: location.culturalInfo,
        touristDescription: location.touristDescription,
        bestTimeToVisit: location.bestTimeToVisit,
        estimatedDurationMinutes: location.estimatedDurationMinutes ? String(location.estimatedDurationMinutes) : "",
        accessibility: location.accessibility,
        photographyRules: location.photographyRules,
        droneRules: location.droneRules,
        transportationTips: location.transportationTips,
        localTips: location.localTips,
        emergencyInstructions: location.emergencyInstructions,
        interestingFacts: location.interestingFacts.join(", "),
        unescoStatus: location.unescoStatus ?? "",
        foreignPrice: location.ticket.foreignPrice !== undefined ? String(location.ticket.foreignPrice) : "",
        egyptianPrice: location.ticket.egyptianPrice !== undefined ? String(location.ticket.egyptianPrice) : "",
        free: location.ticket.free ?? false,
        openingHoursNote: location.openingHours.note ?? "",
        phone: location.contact.phone ?? "",
        email: location.contact.email ?? "",
        website: location.contact.website ?? "",
        googleMapsUrl: location.contact.googleMapsUrl ?? "",
        images: location.images.map((img) => img.url).join(", "),
        localLaws: location.localLaws ?? "",
        notes: location.notes ?? "",
        documents: joinPairs(location.documents),
        attachments: location.attachments.map((a) => `${a.name} = ${a.url}`).join("\n"),
        externalLinks: location.externalLinks.map((l) => `${l.label} = ${l.url}`).join("\n"),
        customMetadata: joinMetadata(location.customMetadata),
      });
    } else if (open) {
      setValues({
        ...EMPTY,
        lat: initialCoords ? String(initialCoords.lat) : "",
        lng: initialCoords ? String(initialCoords.lng) : "",
        address: reverse?.address ?? "",
        governorate: reverse?.governorate ?? "Cairo",
        city: reverse?.city ?? "",
        country: reverse?.country ?? "Egypt",
      });
    }
    if (open) {
      setErrors({});
      setTab("general");
    }
  }

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!values.nameEn.trim()) next.nameEn = "English name is required";
    if (!values.category) next.category = "Category is required";
    if (!values.governorate) next.governorate = "Governorate is required";
    if (!values.city.trim()) next.city = "City is required";
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    if (!isValidCoordinate(lat, lng)) next.lat = "Valid coordinates are required";
    if (!values.country.trim()) next.country = "Country is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    const input: LocationInput = {
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      description: values.description.trim(),
      category: values.category as LocationInput["category"],
      governorate: values.governorate,
      city: values.city.trim(),
      country: values.country.trim(),
      address: values.address.trim(),
      lat: Number(values.lat),
      lng: Number(values.lng),
      tags: splitList(values.tags),
      visibility: values.visibility,
      history: values.history.trim(),
      culturalInfo: values.culturalInfo.trim(),
      touristDescription: values.touristDescription.trim(),
      bestTimeToVisit: values.bestTimeToVisit.trim(),
      estimatedDurationMinutes: values.estimatedDurationMinutes ? Number(values.estimatedDurationMinutes) : undefined,
      accessibility: values.accessibility.trim(),
      photographyRules: values.photographyRules.trim(),
      droneRules: values.droneRules.trim(),
      transportationTips: values.transportationTips.trim(),
      localTips: values.localTips.trim(),
      emergencyInstructions: values.emergencyInstructions.trim(),
      interestingFacts: splitList(values.interestingFacts),
      unescoStatus: values.unescoStatus.trim() || undefined,
      ticket: {
        currency: "EGP",
        foreignPrice: values.foreignPrice ? Number(values.foreignPrice) : undefined,
        egyptianPrice: values.egyptianPrice ? Number(values.egyptianPrice) : undefined,
        free: values.free,
      },
      openingHours: values.openingHoursNote ? { note: values.openingHoursNote.trim() } : {},
      contact: {
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        website: values.website.trim() || undefined,
        googleMapsUrl: values.googleMapsUrl.trim() || undefined,
      },
      customMetadata: splitMetadata(values.customMetadata),
      localLaws: values.localLaws.trim() || undefined,
      notes: values.notes.trim() || undefined,
      documents: splitPairs(values.documents).map((d) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: d.title,
        url: d.url,
      })),
      attachments: splitPairs(values.attachments).map((a) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: a.title,
        url: a.url,
      })),
      externalLinks: splitPairs(values.externalLinks).map((l) => ({
        id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: l.title,
        url: l.url,
      })),
    };

    if (isEdit && location) {
      updateMutation.mutate(input, {
        onSuccess: () => {
          toast.success(`"${input.nameEn}" updated`);
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          toast.success(`"${input.nameEn}" created as draft`);
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    }
  };

  const categories: SelectOption[] = LOCATION_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
  const governoratesQuery = useGovernorates();
  const governorateOptions: SelectOption[] = (governoratesQuery.data?.length
    ? governoratesQuery.data
    : GOVERNORATES
  ).map((g) => {
    const label = typeof g === 'string' ? g : g.name;
    return { value: label, label };
  });
  const cities: SelectOption[] = EGYPT_CITIES.map((c) => ({ value: c, label: c }));
  const visibilityOptions: SelectOption[] = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "restricted", label: "Restricted" },
  ];

  const coordsLabel = useMemo(() => {
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    return isValidCoordinate(lat, lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Click the map to capture coordinates";
  }, [values.lat, values.lng]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-2xl p-0 sm:max-w-3xl">
        <div className="border-b border-border/60 px-6 py-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit location — ${location?.nameEn}` : "Create location"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the geographic profile. Changes are versioned and audit-logged."
                : "Fill in the general and tourism information. Coordinates are captured automatically when you click the map."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex gap-1 rounded-xl bg-muted/60 p-1">
            {(["general", "tourism", "cms"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "general" ? "General information" : t === "tourism" ? "Tourism & media" : "CMS details"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {tab === "general" ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 text-sm text-brand">
                <MapPin className="size-4 shrink-0" />
                {coordsLabel}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Arabic name" value={values.nameAr} onChange={(v) => set("nameAr", v)} placeholder="الاسم بالعربية" />
                <TextInput
                  label="English name"
                  required
                  value={values.nameEn}
                  onChange={(v) => set("nameEn", v)}
                  error={errors.nameEn}
                  placeholder="e.g. Pyramids of Giza"
                />
              </div>

              <TextAreaField label="Description" value={values.description} onChange={(v) => set("description", v)} rows={3} />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Category" required value={values.category} onValueChange={(v) => set("category", v)} options={categories} error={errors.category} placeholder="Choose a category" />
                <SelectField label="Visibility" value={values.visibility} onValueChange={(v) => set("visibility", v as GeoVisibility)} options={visibilityOptions} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField label="Governorate" required value={values.governorate} onValueChange={(v) => set("governorate", v)} options={governorateOptions} error={errors.governorate} />
                <SelectField label="City" required value={values.city} onValueChange={(v) => set("city", v)} options={cities} error={errors.city} placeholder="Select city" />
                <TextInput label="Country" required value={values.country} onChange={(v) => set("country", v)} error={errors.country} />
              </div>

              <TextInput label="Address" value={values.address} onChange={(v) => set("address", v)} placeholder="Street, district, city" />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Latitude" type="number" step="any" value={values.lat} onChange={(v) => set("lat", v)} error={errors.lat} />
                <TextInput label="Longitude" type="number" step="any" value={values.lng} onChange={(v) => set("lng", v)} error={errors.lat} />
              </div>

              <TextInput label="Tags (comma separated)" value={values.tags} onChange={(v) => set("tags", v)} placeholder="ancient, unesco, must-see" />
            </div>
          ) : tab === "tourism" ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-xl bg-violet-500/5 px-3 py-2 text-sm text-violet-600 dark:text-violet-400">
                <Sparkles className="size-4 shrink-0" />
                Tourism & safety details power the AI service, mobile app, and Risk Intelligence.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField label="History" value={values.history} onChange={(v) => set("history", v)} rows={2} />
                <TextAreaField label="Cultural information" value={values.culturalInfo} onChange={(v) => set("culturalInfo", v)} rows={2} />
              </div>
              <TextAreaField label="Tourist description" value={values.touristDescription} onChange={(v) => set("touristDescription", v)} rows={2} />

              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput label="Best time to visit" value={values.bestTimeToVisit} onChange={(v) => set("bestTimeToVisit", v)} placeholder="e.g. Early morning" />
                <TextInput label="Est. duration (minutes)" type="number" value={values.estimatedDurationMinutes} onChange={(v) => set("estimatedDurationMinutes", v)} />
                <TextInput label="UNESCO status" value={values.unescoStatus} onChange={(v) => set("unescoStatus", v)} placeholder="e.g. World Heritage Site" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField label="Photography rules" value={values.photographyRules} onChange={(v) => set("photographyRules", v)} rows={2} />
                <TextAreaField label="Drone rules" value={values.droneRules} onChange={(v) => set("droneRules", v)} rows={2} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField label="Accessibility" value={values.accessibility} onChange={(v) => set("accessibility", v)} rows={2} />
                <TextAreaField label="Transportation tips" value={values.transportationTips} onChange={(v) => set("transportationTips", v)} rows={2} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField label="Local tips" value={values.localTips} onChange={(v) => set("localTips", v)} rows={2} />
                <TextAreaField label="Emergency instructions" value={values.emergencyInstructions} onChange={(v) => set("emergencyInstructions", v)} rows={2} />
              </div>

              <TextInput label="Interesting facts (comma separated)" value={values.interestingFacts} onChange={(v) => set("interestingFacts", v)} />

              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ticket & fees</p>
                    <p className="text-xs text-muted-foreground">Prices in EGP</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Free entry</span>
                    <Switch checked={values.free} onCheckedChange={(checked) => set("free", checked)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Foreigner price (EGP)" type="number" value={values.foreignPrice} onChange={(v) => set("foreignPrice", v)} disabled={values.free} />
                  <TextInput label="Egyptian price (EGP)" type="number" value={values.egyptianPrice} onChange={(v) => set("egyptianPrice", v)} disabled={values.free} />
                </div>
              </div>

              <TextAreaField label="Opening hours note" value={values.openingHoursNote} onChange={(v) => set("openingHoursNote", v)} rows={2} placeholder="e.g. Daily 9:00 - 17:00, closed Fridays" />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Contact phone" value={values.phone} onChange={(v) => set("phone", v)} />
                <TextInput label="Contact email" value={values.email} onChange={(v) => set("email", v)} />
                <TextInput label="Website" value={values.website} onChange={(v) => set("website", v)} />
                <TextInput label="Google Maps link" value={values.googleMapsUrl} onChange={(v) => set("googleMapsUrl", v)} />
              </div>

              <TextInput
                label="Image URLs (comma separated)"
                value={values.images}
                onChange={(v) => set("images", v)}
                placeholder="https://.../photo1.jpg, https://.../photo2.jpg"
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 text-sm text-brand">
                <Sparkles className="size-4 shrink-0" />
                CMS fields feed the mobile app, AI service, and public APIs.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextAreaField label="Local laws" value={values.localLaws} onChange={(v) => set("localLaws", v)} rows={2} placeholder="e.g. Alcohol sale prohibited on-site" />
                <TextAreaField label="Notes" value={values.notes} onChange={(v) => set("notes", v)} rows={2} placeholder="Internal editorial notes" />
              </div>

              <TextAreaField
                label="Documents (one per line: Title = URL)"
                value={values.documents}
                onChange={(v) => set("documents", v)}
                rows={2}
                placeholder={"Tourist map = https://.../map.pdf\nVisitor rules = https://.../rules.pdf"}
              />

              <TextAreaField
                label="Attachments (one per line: Name = URL)"
                value={values.attachments}
                onChange={(v) => set("attachments", v)}
                rows={2}
                placeholder={"Site plan = https://.../plan.pdf"}
              />

              <TextAreaField
                label="External links (one per line: Label = URL)"
                value={values.externalLinks}
                onChange={(v) => set("externalLinks", v)}
                rows={2}
                placeholder={"Official website = https://site.example\nInstagram = https://instagram.com/..."}
              />

              <TextAreaField
                label="Custom metadata (one per line: key = value)"
                value={values.customMetadata}
                onChange={(v) => set("customMetadata", v)}
                rows={3}
                hint="Extensible key/value pairs for AI and future APIs."
                placeholder={"opening_season = winter\ncapacity = 500\nparking = onsite"}
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            {Object.keys(errors).length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="size-3.5" />
                Fix the highlighted fields
              </span>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner size="sm" /> : isEdit ? "Save changes" : "Create location"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { FormValues };
