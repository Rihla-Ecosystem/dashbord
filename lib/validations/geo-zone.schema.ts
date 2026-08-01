import { z } from "zod";

export const geoZoneSchema = z.object({
  name: z.string().optional(),
  reason: z.string().optional(),
  subtype: z.string().min(1, "Subtype is required"),
  zone_type: z.string().default("restricted"),
  geometry: z.object({
    type: z.string(),
    coordinates: z.any(),
  }),
});

export type GeoZoneFormValues = z.infer<typeof geoZoneSchema>;