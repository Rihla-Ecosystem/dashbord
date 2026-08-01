const BASE_URL = process.env.GEOCONTEXT_API_URL;
const TOKEN = process.env.GEOCONTEXT_API_TOKEN;

export type RestrictedZone = {
  id: string;
  osm_type: string | null;
  osm_id: number | null;
  name: string | null;
  reason: string | null;
  subtype: string;
  zone_type: string;
  source: string;
};

export type RestrictedZoneInput = {
  name?: string | null;
  reason?: string | null;
  subtype: string;
  zone_type?: string;
  source?: string;
  geometry: Record<string, unknown>;
};

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  };
}

export async function listRestrictedZones(): Promise<RestrictedZone[]> {
  const res = await fetch(`${BASE_URL}/api/v1/restricted-zones`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to list zones: ${res.status}`);
  return res.json();
}

export async function createRestrictedZone(input: RestrictedZoneInput): Promise<RestrictedZone> {
  const res = await fetch(`${BASE_URL}/api/v1/restricted-zones`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...input, source: input.source ?? "manual" }),
  });
  if (!res.ok) throw new Error(`Failed to create zone: ${res.status}`);
  return res.json();
}

export async function updateRestrictedZone(id: string, input: Partial<RestrictedZoneInput>): Promise<RestrictedZone> {
  const res = await fetch(`${BASE_URL}/api/v1/restricted-zones/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update zone: ${res.status}`);
  return res.json();
}

export async function deleteRestrictedZone(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/restricted-zones/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to delete zone: ${res.status}`);
}