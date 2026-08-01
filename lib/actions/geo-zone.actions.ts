"use server";

import { revalidatePath } from "next/cache";
import { geoZoneSchema } from "@/lib/validations/geo-zone.schema";
import {
  listRestrictedZones,
  createRestrictedZone,
  updateRestrictedZone,
  deleteRestrictedZone,
} from "@/lib/external/geo-restricted-zones";

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
    await createRestrictedZone({ ...parsed.data, source: "manual" });
    revalidatePath("/geo-context/restricted-zones");
    return { success: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function updateZoneAction(id: string, raw: unknown) {
  const parsed = geoZoneSchema.partial().safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten() };

  try {
    await updateRestrictedZone(id, parsed.data);
    revalidatePath("/geo-context/restricted-zones");
    return { success: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteZoneAction(id: string) {
  try {
    await deleteRestrictedZone(id);
    revalidatePath("/geo-context/restricted-zones");
    return { success: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
