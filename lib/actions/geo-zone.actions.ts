"use server";

import { revalidatePath } from "next/cache";
import { geoZoneSchema } from "@/lib/validations/geo-zone.schema";
import {
  listRestrictedZones,
  createRestrictedZone,
  updateRestrictedZone,
  deleteRestrictedZone,
} from "@/lib/external/geo-restricted-zones";

const ZONES_PATH = "/geo-context/restricted-zones";

export async function getZones() {
  try {
    return { data: await listRestrictedZones() };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function createZoneAction(raw: unknown) {
  const parsed = geoZoneSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten() };

  try {
    const zone = await createRestrictedZone({ ...parsed.data, source: "manual" });
    revalidatePath(ZONES_PATH);
    return { success: true as const, data: zone };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function updateZoneAction(id: string, raw: unknown) {
  const parsed = geoZoneSchema.partial().safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten() };

  try {
    const zone = await updateRestrictedZone(id, parsed.data);
    revalidatePath(ZONES_PATH);
    return { success: true as const, data: zone };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteZoneAction(id: string) {
  try {
    await deleteRestrictedZone(id);
    revalidatePath(ZONES_PATH);
    return { success: true as const };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
