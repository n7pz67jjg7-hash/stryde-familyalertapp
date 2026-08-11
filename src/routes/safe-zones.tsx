import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPinned, Plus, Trash2 } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { toast } from "sonner";

export const Route = createFileRoute("/safe-zones")({
  head: () => ({
    meta: [
      { title: "Safe zones — STRYDE" },
      { name: "description", content: "Define home and clinic geofences so family knows when you leave a safe area." },
      { property: "og:title", content: "Safe zones — STRYDE" },
      { property: "og:description", content: "Geofenced safe areas for peace of mind." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafeZones,
});

type Zone = { id: string; name: string; lat: number; lng: number; radius_m: number; active: boolean };

function SafeZones() {
  const { user } = useAuth();
  const { geo, requestGeo } = useDeviceStatus();
  const [zones, setZones] = useState<Zone[]>([]);
  const [name, setName] = useState("Home");
  const [radius, setRadius] = useState(200);

  const load = async () => {
    const { data } = await supabase.from("safe_zones" as never).select("*").order("created_at");
    setZones((data as unknown as Zone[]) || []);
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const add = async () => {
    if (!user) return toast.error("Sign in first");
    if (!geo.coords) {
      requestGeo();
      return toast.error("Waiting for your GPS location");
    }
    const { error } = await supabase.from("safe_zones" as never).insert({
      patient_id: user.id,
      name: name.trim() || "Safe zone",
      lat: geo.coords.lat,
      lng: geo.coords.lng,
      radius_m: radius,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Safe zone created at your current location");
    void load();
  };

  const toggle = async (z: Zone) => {
    await supabase.from("safe_zones" as never).update({ active: !z.active } as never).eq("id", z.id);
    void load();
  };

  const inside = (z: Zone) => {
    if (!geo.coords) return null;
    const R = 6371000;
    const dLat = ((z.lat - geo.coords.lat) * Math.PI) / 180;
    const dLng = ((z.lng - geo.coords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((geo.coords.lat * Math.PI) / 180) * Math.cos((z.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= z.radius_m;
  };

  return (
    <Screen title="Safe zones" subtitle="Geofenced areas around you">
      <Card className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zone name (Home, Clinic…)"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
        />
        <label className="block text-xs text-muted-foreground">Radius: {radius} m</label>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full"
        />
        <button
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Create zone at my location
        </button>
      </Card>

      {zones.length === 0 && <Empty text="No safe zones yet." />}
      {zones.map((z) => {
        const here = inside(z);
        return (
          <Card key={z.id} className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold">
                <MapPinned className="h-4 w-4 text-primary" /> {z.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {z.radius_m} m ·{" "}
                {here === null ? "location unknown" : here ? "you are inside" : "you are outside"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggle(z)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  z.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {z.active ? "Active" : "Paused"}
              </button>
              <button
                onClick={async () => {
                  await supabase.from("safe_zones" as never).delete().eq("id", z.id);
                  void load();
                }}
                aria-label="Delete zone"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </Card>
        );
      })}
    </Screen>
  );
}
