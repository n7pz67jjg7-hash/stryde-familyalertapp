import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambulance, MapPin, Phone, ShieldAlert } from "lucide-react";
import { Screen, Card } from "@/components/Screen";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ambulance")({
  head: () => ({
    meta: [
      { title: "Call an ambulance — STRYDE" },
      { name: "description", content: "Egyptian emergency numbers, your live coordinates and medical summary in one place." },
      { property: "og:title", content: "Call an ambulance — STRYDE" },
      { property: "og:description", content: "Emergency numbers plus your live location and medical summary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AmbulancePage,
});

const NUMBERS = [
  { label: "Ambulance", number: "123", note: "National ambulance service" },
  { label: "Police", number: "122", note: "Emergency police" },
  { label: "Fire brigade", number: "180", note: "Civil protection" },
  { label: "Tourist police", number: "126", note: "Assistance for visitors" },
];

function AmbulancePage() {
  const { geo } = useDeviceStatus();
  const { profile } = useAuth();
  const coords = geo.coords?.lat ? `${geo.coords!.lat.toFixed(5)}, ${geo.coords!.lng?.toFixed(5)}` : "Locating…";

  return (
    <Screen title="Ambulance & hotlines" subtitle="Egypt emergency numbers">
      <Card className="space-y-2 border-destructive/40 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive">
          <Ambulance className="h-5 w-5" />
          <p className="text-sm font-semibold">Call 123 for an ambulance</p>
        </div>
        <a
          href="tel:123"
          className="block w-full rounded-xl bg-destructive py-3 text-center text-sm font-semibold text-destructive-foreground"
        >
          Call 123 now
        </a>
      </Card>

      <Card className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-primary" /> Read this to the operator
        </p>
        <p className="text-sm text-muted-foreground">Coordinates: {coords}</p>
        <p className="text-sm text-muted-foreground">
          Patient: {profile?.full_name || "—"} · {profile?.age ?? "—"} yrs · Blood {profile?.blood_type || "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          Conditions: {profile?.medical_conditions?.length ? profile.medical_conditions.join(", ") : "none recorded"}
        </p>
      </Card>

      <div className="space-y-2">
        {NUMBERS.map((n) => (
          <a key={n.number} href={`tel:${n.number}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.note}</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-primary">
                <Phone className="h-4 w-4" /> {n.number}
              </span>
            </Card>
          </a>
        ))}
      </div>

      <Link to="/nearest-er">
        <Card className="flex items-center gap-2 text-sm font-medium text-primary">
          <ShieldAlert className="h-4 w-4" /> Find the nearest emergency room
        </Card>
      </Link>
    </Screen>
  );
}
