"use client";

import { reverseGeocode, isValidCoordinate, type ReverseGeocodeResult } from "../geoUtils";
import { geometryToPayload, type DraftGeometry } from "../drawing/geometry";
import type { GeoLocation, LocationInput } from "@/types/geocontext";

export interface LocationFormValues {
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
  visibility: GeoLocation["visibility"];
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

export const EMPTY_VALUES: LocationFormValues = {
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

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function splitPairs(value: string): { title: string; url: string }[] {
  return splitLines(value).flatMap((line) => {
    const idx = line.indexOf("=");
    if (idx === -1) return [];
    const title = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    return title && url ? [{ title, url }] : [];
  });
}

export function splitMetadata(value: string): Record<string, string> {
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

export function joinPairs(items: { title: string; url: string }[]): string {
  return items.map((item) => `${item.title} = ${item.url}`).join("\n");
}

export function joinMetadata(items: Record<string, string>): string {
  return Object.entries(items)
    .map(([key, value]) => `${key} = ${value}`)
    .join("\n");
}

export function valuesFromLocation(location: GeoLocation): LocationFormValues {
  return {
    nameAr: location.nameAr ?? "",
    nameEn: location.nameEn,
    description: location.description ?? "",
    category: location.category,
    governorate: location.governorate,
    city: location.city,
    country: location.country,
    address: location.address ?? "",
    lat: String(location.lat),
    lng: String(location.lng),
    tags: (location.tags ?? []).join(", "),
    visibility: location.visibility ?? "public",
    history: location.history ?? "",
    culturalInfo: location.culturalInfo ?? "",
    touristDescription: location.touristDescription ?? "",
    bestTimeToVisit: location.bestTimeToVisit ?? "",
    estimatedDurationMinutes: location.estimatedDurationMinutes ? String(location.estimatedDurationMinutes) : "",
    accessibility: location.accessibility ?? "",
    photographyRules: location.photographyRules ?? "",
    droneRules: location.droneRules ?? "",
    transportationTips: location.transportationTips ?? "",
    localTips: location.localTips ?? "",
    emergencyInstructions: location.emergencyInstructions ?? "",
    interestingFacts: (location.interestingFacts ?? []).join(", "),
    unescoStatus: location.unescoStatus ?? "",
    foreignPrice: location.ticket?.foreignPrice !== undefined ? String(location.ticket.foreignPrice) : "",
    egyptianPrice: location.ticket?.egyptianPrice !== undefined ? String(location.ticket.egyptianPrice) : "",
    free: location.ticket?.free ?? false,
    openingHoursNote: location.openingHours?.note ?? "",
    phone: location.contact?.phone ?? "",
    email: location.contact?.email ?? "",
    website: location.contact?.website ?? "",
    googleMapsUrl: location.contact?.googleMapsUrl ?? "",
    images: (location.images ?? []).map((img) => img.url).join(", "),
    localLaws: location.localLaws ?? "",
    notes: location.notes ?? "",
    documents: joinPairs(location.documents ?? []),
    attachments: (location.attachments ?? []).map((a) => `${a.name} = ${a.url}`).join("\n"),
    externalLinks: (location.externalLinks ?? []).map((l) => `${l.label} = ${l.url}`).join("\n"),
    customMetadata: joinMetadata(location.customMetadata ?? {}),
  };
}

export function valuesWithInitial(
  geometry: DraftGeometry | null,
  reverse: ReverseGeocodeResult | null
): LocationFormValues {
  const centroid = geometry?.centroid;
  return {
    ...EMPTY_VALUES,
    lat: centroid ? String(centroid.lat) : "",
    lng: centroid ? String(centroid.lng) : "",
    address: reverse?.address ?? "",
    governorate: reverse?.governorate ?? "Cairo",
    city: reverse?.city ?? "",
    country: reverse?.country ?? "Egypt",
  };
}

export function validateLocationForm(values: LocationFormValues): Record<string, string> {
  const next: Record<string, string> = {};
  if (!values.nameEn.trim()) next.nameEn = "English name is required";
  if (!values.category) next.category = "Category is required";
  if (!values.governorate) next.governorate = "Governorate is required";
  if (!values.city.trim()) next.city = "City is required";
  const lat = Number(values.lat);
  const lng = Number(values.lng);
  if (!isValidCoordinate(lat, lng)) next.lat = "Valid coordinates are required";
  if (!values.country.trim()) next.country = "Country is required";
  return next;
}

/** Build the backend payload. `geometry` (from the map overlay) wins over the typed coords. */
export function valuesToInput(
  values: LocationFormValues,
  geometry: DraftGeometry | null
): LocationInput {
  const centroid = geometry?.centroid ?? null;
  const lat = centroid ? centroid.lat : Number(values.lat);
  const lng = centroid ? centroid.lng : Number(values.lng);
  const polygonPayload = geometryToPayload(geometry);

  const customMetadata = splitMetadata(values.customMetadata);
  if (polygonPayload) customMetadata.polygon = polygonPayload;
  else delete customMetadata.polygon;

  return {
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    description: values.description.trim(),
    category: values.category as LocationInput["category"],
    governorate: values.governorate,
    city: values.city.trim(),
    country: values.country.trim(),
    address: values.address.trim(),
    lat,
    lng,
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
    customMetadata,
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
}

export async function fetchReverse(geometry: DraftGeometry | null): Promise<ReverseGeocodeResult | null> {
  const c = geometry?.centroid;
  if (!c) return null;
  try {
    return await reverseGeocode(c.lat, c.lng);
  } catch {
    return null;
  }
}
