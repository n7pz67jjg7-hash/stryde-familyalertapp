import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Navigation, Phone } from "lucide-react";
import { Screen, Card, Empty, Stars } from "@/components/Screen";
import { nearbyHospitals, type Hospital } from "@/lib/hospitals.functions";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";

export const Route = createFileRoute("/nearest-er")({
  head: () => ({
    meta: [
      { title: "Nearest emergency room — STRYDE" },
      { name: "description", content: "Closest hospitals and emergency rooms to your live GPS location." },
      { property: "og:title", content: "Nearest emergency room — STRYDE" },
      { property: "og:description", content: "Closest hospitals to your live GPS location." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NearestER,
});

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function NearestER() {
  const { geo, requestGeo } = useDeviceStatus();
  const nearby = useServerFn(nearbyHospitals);
  const [list, setList] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!geo.coords?.lat || !geo.coords?.lng || list.length) return;
    setLoading(true);
    nearby({ data: { lat: geo.coords!.lat, lng: geo.coords!.lng } })
      .then((r) => setList(r.hospitals))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load nearby hospitals"))
      .finally(() => setLoading(false));
  }, [geo.coords?.lat, geo.coords?.lng, list.length, nearby]);

  return (
    <Screen title="Nearest emergency room" subtitle="Sorted by distance from you">
      {!geo.coords?.lat && (
        <Card className="space-y-3 text-sm">
          <p>Allow location access to find the closest emergency rooms.</p>
          <button
            onClick={requestGeo}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Enable location
          </button>
        </Card>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding hospitals near you…
        </div>
      )}
      {err && <Empty text={err} />}
      {list.map((h) => {
        const km = geo.coords?.lat && geo.coords?.lng ? distanceKm([geo.coords!.lat, geo.coords!.lng], [h.lat, h.lng]) : null;
        return (
          <Card key={h.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Link to="/hospitals/$placeId" params={{ placeId: h.id }} className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{h.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{h.address}</p>
              </Link>
              {km !== null && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {km.toFixed(1)} km
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Stars value={h.rating ?? 0} />
              <span>{h.rating?.toFixed(1) ?? "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <a
                href={h.phone ? `tel:${h.phone}` : "#"}
                className="flex items-center justify-center gap-1 rounded-xl bg-muted py-2"
              >
                <Phone className="h-3.5 w-3.5 text-primary" /> Call
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 rounded-xl bg-muted py-2"
              >
                <Navigation className="h-3.5 w-3.5 text-primary" /> Directions
              </a>
            </div>
          </Card>
        );
      })}
    </Screen>
  );
}
