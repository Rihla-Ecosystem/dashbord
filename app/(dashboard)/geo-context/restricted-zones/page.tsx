import { getZones } from "@/lib/actions/geo-zone.actions";
import { RestrictedZonesClient } from "./RestrictedZonesClient";

export default async function RestrictedZonesPage() {
  const result = await getZones();

  return <RestrictedZonesClient initialZones={result.data ?? []} error={result.error} />;
}
