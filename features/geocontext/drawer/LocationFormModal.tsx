"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, MapPin, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  TextInput,
  TextAreaField,
  SelectField,
  type SelectOption,
} from "../form-fields";
import { LOCATION_TABS, type LocationTab } from "./tabs";
import { LocationViewTabs } from "./location-view";
import {
  fetchReverse,
  validateLocationForm,
  valuesFromLocation,
  valuesToInput,
  valuesWithInitial,
  type LocationFormValues,
} from "./location-form";
import { polygonGeometry, type DraftGeometry } from "../drawing/geometry";
import { isValidCoordinate } from "../geoUtils";
import {
  EGYPT_CITIES,
  GOVERNORATES,
  LOCATION_CATEGORIES,
} from "@/constants/geocontext";
import {
  useCreateGeoLocation,
  useGeoLocation,
  useGovernorates,
  useUpdateGeoLocation,
} from "@/hooks/useGeocontext";
import { useGeoWorkspace } from "../workspace-context";
import { getErrorMessage } from "@/utils";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/types/geocontext";

function geometryLabel(geometry: DraftGeometry | null): string {
  if (!geometry || geometry.parts.length === 0) return "No geometry captured yet";
  const types = geometry.parts.map((p) => p.type).join(", ");
  const verts = geometry.parts.reduce((n, p) => n + (p.type === "polygon" ? p.coords.length : 1), 0);
  return `${types} · ${verts} vertices`;
}

function coordsFromGeometry(geometry: DraftGeometry | null): { lat: number; lng: number } | null {
  const c = geometry?.centroid;
  if (!c) return null;
  return isValidCoordinate(c.lat, c.lng) ? { lat: c.lat, lng: c.lng } : null;
}

// -----------------------------------------------------------------------------
// Form tab sections (edit / create modes)
// -----------------------------------------------------------------------------

function FormGeneral({
  values,
  set,
  errors,
}: {
  values: LocationFormValues;
  set: <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) => void;
  errors: Record<string, string>;
}) {
  const categories: SelectOption[] = LOCATION_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
  const visibilityOptions: SelectOption[] = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "restricted", label: "Restricted" },
  ];

  return (
    <div className="space-y-4">
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
        <SelectField
          label="Category"
          required
          value={values.category}
          onValueChange={(v) => set("category", v)}
          options={categories}
          error={errors.category}
          placeholder="Choose a category"
        />
        <SelectField
          label="Visibility"
          value={values.visibility}
          onValueChange={(v) => set("visibility", v as GeoLocation["visibility"])}
          options={visibilityOptions}
        />
      </div>

      <TextInput label="Tags (comma separated)" value={values.tags} onChange={(v) => set("tags", v)} placeholder="ancient, unesco, must-see" />
      <TextInput label="Address" value={values.address} onChange={(v) => set("address", v)} placeholder="Street, district, city" />
    </div>
  );
}

function FormLocation({
  values,
  set,
  errors,
  geometry,
  canDraw,
}: {
  values: LocationFormValues;
  set: <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) => void;
  errors: Record<string, string>;
  geometry: DraftGeometry | null;
  canDraw: boolean;
}) {
  const ws = useGeoWorkspace();
  const governoratesQuery = useGovernorates();
  const governorateOptions: SelectOption[] = (governoratesQuery.data?.length
    ? governoratesQuery.data.map((g) => (typeof g === "string" ? g : g.name))
    : GOVERNORATES
  ).map((label) => ({ value: label, label }));
  const cities: SelectOption[] = EGYPT_CITIES.map((c) => ({ value: c, label: c }));
  const coords = coordsFromGeometry(geometry);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MapPin className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{geometryLabel(geometry)}</p>
          <p className="text-xs text-muted-foreground">
            {coords
              ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : "Capture the geometry with the draw tools or type coordinates below."}
          </p>
        </div>
        {canDraw && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ws.setSection("map");
              ws.requestDraw();
            }}
          >
            <MousePointerClick className="size-4" />
            {geometry ? "Redraw" : "Draw on map"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Latitude" type="number" step="any" value={values.lat} onChange={(v) => set("lat", v)} error={errors.lat} />
        <TextInput label="Longitude" type="number" step="any" value={values.lng} onChange={(v) => set("lng", v)} error={errors.lat} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Governorate"
          required
          value={values.governorate}
          onValueChange={(v) => set("governorate", v)}
          options={governorateOptions}
          error={errors.governorate}
        />
        <SelectField
          label="City"
          required
          value={values.city}
          onValueChange={(v) => set("city", v)}
          options={cities}
          error={errors.city}
          placeholder="Select city"
        />
        <TextInput label="Country" required value={values.country} onChange={(v) => set("country", v)} error={errors.country} />
      </div>
    </div>
  );
}

function FormTourism({
  values,
  set,
}: {
  values: LocationFormValues;
  set: <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) => void;
}) {
  return (
    <div className="space-y-4">
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

      <TextAreaField
        label="Opening hours note"
        value={values.openingHoursNote}
        onChange={(v) => set("openingHoursNote", v)}
        rows={2}
        placeholder="e.g. Daily 9:00 - 17:00, closed Fridays"
      />

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
  );
}

function FormSafety({
  values,
  set,
  location,
}: {
  values: LocationFormValues;
  set: <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) => void;
  location: GeoLocation | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField label="Photography rules" value={values.photographyRules} onChange={(v) => set("photographyRules", v)} rows={2} />
        <TextAreaField label="Drone rules" value={values.droneRules} onChange={(v) => set("droneRules", v)} rows={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField label="Local laws" value={values.localLaws} onChange={(v) => set("localLaws", v)} rows={2} placeholder="e.g. Alcohol sale prohibited on-site" />
        <TextAreaField label="Emergency instructions" value={values.emergencyInstructions} onChange={(v) => set("emergencyInstructions", v)} rows={2} />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 p-4">
        <p className="text-sm font-medium">Safety score</p>
        {location ? (
          <span className="text-sm font-bold">{location.safetyScore}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function FormMedia({
  values,
  set,
}: {
  values: LocationFormValues;
  set: <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <TextInput
        label="Image URLs (comma separated)"
        value={values.images}
        onChange={(v) => set("images", v)}
        placeholder="https://.../photo1.jpg, https://.../photo2.jpg"
      />
      <TextAreaField
        label="Documents (one per line: Title = URL)"
        value={values.documents}
        onChange={(v) => set("documents", v)}
        rows={3}
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
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Centered Create / Edit modal
// -----------------------------------------------------------------------------

export function LocationFormModal() {
  const ws = useGeoWorkspace();
  const target = ws.drawerTarget;
  const isCreate = target.kind === "create-location";
  const isEdit = target.kind === "location" && target.mode === "edit";
  const open = isCreate || isEdit;

  const locationId = isEdit ? target.locationId : null;
  const detailQuery = useGeoLocation(locationId);
  const location = detailQuery.data ?? null;

  const [tab, setTab] = useState<LocationTab>("general");
  const [values, setValues] = useState<LocationFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateGeoLocation();
  const updateMutation = useUpdateGeoLocation(isEdit ? target.locationId : "");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const geometry = isCreate
    ? ws.draftGeometry ?? target.geometry
    : (ws.draftGeometry ??
      (location?.polygon && location.polygon.length >= 3 ? polygonGeometry(location.polygon) : null));

  // Keep form values in sync when the target location resolves asynchronously.
  const [sourceKey, setSourceKey] = useState("init");
  const nextSourceKey = isCreate ? "create" : `loc-${location?.id ?? "none"}`;
  if (nextSourceKey !== sourceKey) {
    setSourceKey(nextSourceKey);
    if (isCreate) {
      setValues(valuesWithInitial(ws.draftGeometry ?? target.geometry, null));
      setTab("general");
    } else if (location) {
      setValues(valuesFromLocation(location));
    } else {
      setValues(null);
    }
  }

  // Reverse-geocode the draft centroid while creating and prefill the address fields.
  useEffect(() => {
    if (!isCreate) return;
    let cancelled = false;
    const g = ws.draftGeometry ?? target.geometry;
    fetchReverse(g).then((r) => {
      if (cancelled || !r) return;
      setValues((v) =>
        v
          ? {
              ...v,
              address: v.address || r.address || "",
              governorate: v.governorate || r.governorate || "Cairo",
              city: v.city || r.city || "",
              country: v.country || r.country || "Egypt",
            }
          : v
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, ws.draftGeometry?.centroid?.lat, ws.draftGeometry?.centroid?.lng]);

  const set = <K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) =>
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));

  const submit = () => {
    if (!values) return;
    const nextErrors = validateLocationForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.nameEn) setTab("general");
      else if (nextErrors.category || nextErrors.governorate || nextErrors.city || nextErrors.country) setTab("location");
      else if (nextErrors.lat) setTab("location");
      return;
    }
    const input = valuesToInput(values, geometry);
    if (isEdit && location) {
      updateMutation.mutate(input, {
        onSuccess: () => {
          toast.success(`"${input.nameEn}" updated`);
          ws.setDraftGeometry(null);
          ws.openLocation(location, "view");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      createMutation.mutate(input, {
        onSuccess: (created) => {
          toast.success(`"${input.nameEn}" created`);
          ws.setDraftGeometry(null);
          ws.setDrawMode(null);
          ws.setDrawIntent(null);
          ws.openLocation(created, "view");
          ws.flyToMap(created.lat, created.lng, 13);
          ws.pushRecentLocation(created.id);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  const cancel = () => {
    setErrors({});
    if (isEdit && location) ws.openLocation(location, "view");
    else ws.closeDrawer();
  };

  const activityEvents = ws.activity
    .filter((a) => a.targetId === location?.id || a.targetName === location?.nameEn)
    .slice(0, 25);

  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(next) => !next && cancel()}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>{isCreate ? "New location" : `Edit location — ${location?.nameEn ?? ""}`}</ModalTitle>
          <ModalDescription>
            {isCreate
              ? "Capture the geometry on the map, fill the details, then save."
              : "Changes are versioned and audit-logged."}
          </ModalDescription>
        </ModalHeader>

        {/* tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/50 bg-muted/20 px-3 py-1.5">
          {LOCATION_TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <ModalBody>
          {!values ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {tab === "general" && <FormGeneral values={values} set={set} errors={errors} />}
              {tab === "location" && <FormLocation values={values} set={set} errors={errors} geometry={geometry} canDraw={ws.canEdit} />}
              {tab === "tourism" && <FormTourism values={values} set={set} />}
              {tab === "safety" && <FormSafety values={values} set={set} location={location} />}
              {tab === "media" && <FormMedia values={values} set={set} />}
              {tab === "nearby" &&
                (location ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Nearby services are managed independently and save immediately.</p>
                    <LocationViewTabs location={location} tab="nearby" canEdit={ws.canEdit} />
                  </div>
                ) : (
                  <EmptyTab label="Nearby services become available after the location is created." />
                ))}
              {tab === "ai" &&
                (location ? (
                  <LocationViewTabs location={location} tab="ai" canEdit={ws.canEdit} />
                ) : (
                  <EmptyTab label="The AI summary and weather card appear after the location is created." />
                ))}
              {tab === "history" &&
                (location ? (
                  <LocationViewTabs location={location} tab="history" canEdit={ws.canEdit} activityEvents={activityEvents} />
                ) : (
                  <EmptyTab label="Version history and audit logs appear after the location is created." />
                ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center gap-2">
            {Object.keys(errors).length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="size-3.5" />
                Fix the highlighted fields to save.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={cancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="outline" onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : <Check className="size-4" />}
              {isCreate ? "Create location" : "Save changes"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export type { LocationFormValues };