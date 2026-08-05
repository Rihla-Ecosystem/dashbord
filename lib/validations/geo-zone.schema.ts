import { z } from "zod";

export const SUBTYPE_OPTIONS = [
  "school",
  "hospital",
  "airport",
  "mosque",
  "park",
  "other",
] as const;

export const ZONE_TYPE_OPTIONS = ["restricted", "warning", "allowed"] as const;

export type Subtype = (typeof SUBTYPE_OPTIONS)[number];
export type ZoneType = (typeof ZONE_TYPE_OPTIONS)[number];

export type GeoPosition = [number, number, number?];

export type GeoJsonGeometry =
  | { type: "Point"; coordinates: GeoPosition }
  | { type: "MultiPoint"; coordinates: GeoPosition[] }
  | { type: "LineString"; coordinates: GeoPosition[] }
  | { type: "MultiLineString"; coordinates: GeoPosition[][] }
  | { type: "Polygon"; coordinates: GeoPosition[][] }
  | { type: "MultiPolygon"; coordinates: GeoPosition[][][] }
  | { type: "GeometryCollection"; geometries: GeoJsonGeometry[] };

const positionSchema = z.tuple([
  z.number().min(-180, "Longitude must be between -180 and 180").max(180),
  z.number().min(-90, "Latitude must be between -90 and 90").max(90),
  z.number().optional(),
]);

const linearRingSchema = z.array(positionSchema).min(4, "Polygon rings need at least 4 positions");

export const geometrySchema: z.ZodType<GeoJsonGeometry> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("Point"),
      coordinates: positionSchema,
    }),
    z.object({
      type: z.literal("MultiPoint"),
      coordinates: z.array(positionSchema).min(1),
    }),
    z.object({
      type: z.literal("LineString"),
      coordinates: z.array(positionSchema).min(2, "A line string needs at least 2 positions"),
    }),
    z.object({
      type: z.literal("MultiLineString"),
      coordinates: z.array(z.array(positionSchema).min(1)).min(1),
    }),
    z.object({
      type: z.literal("Polygon"),
      coordinates: z.array(linearRingSchema).min(1),
    }),
    z.object({
      type: z.literal("MultiPolygon"),
      coordinates: z.array(z.array(linearRingSchema).min(1)).min(1),
    }),
    z.object({
      type: z.literal("GeometryCollection"),
      geometries: z.array(geometrySchema).min(1),
    }),
  ])
);

export const geoZoneSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  reason: z.string().trim().optional(),
  info: z.string().trim().optional(),
  subtype: z.enum(SUBTYPE_OPTIONS, "Select a valid subtype"),
  zone_type: z.enum(ZONE_TYPE_OPTIONS, "Select a valid zone type").default("restricted"),
  geometry: geometrySchema,
});

export type GeoZoneFormValues = z.input<typeof geoZoneSchema>;
export type GeoZonePayload = z.output<typeof geoZoneSchema>;
