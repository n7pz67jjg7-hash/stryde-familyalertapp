import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, AlertCircle, CheckCircle2, HeartPulse } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — STRYDE" }] }),
  component: Alerts,
});

interface AlertRow {
  id: string;
  patient_id: string;
  triggered_at: string;
  lat: number | null;
  lng: number | null;
  snapshot: Record<string, unknown>;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_code: string | null;
  kind: string | null;
  risk_score: number | null;
}

function Alerts() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<AlertRow[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("emergency_events")
      .select("*")
      .order("triggered_at", { ascending: false })
      .limit(50);
    setItems((data || []) as unknown as AlertRow[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel("emergency-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_events" }, (payload) => {
        load();
        if (payload.eventType === "INSERT") {
          if ("vibrate" in navigator) navigator.vibrate([300, 100, 300]);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("STRYDE emergency alert", { body: "A linked patient triggered an emergency." });
          }
        }
      })
      .subscribe();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const resolveWithCode = async (a: AlertRow) => {
    if (!user) return;
    const entered = (codeInputs[a.id] || "").trim().toUpperCase();
    if (entered.length !== 4) { setErrors((e) => ({ ...e, [a.id]: "Enter the 4-character code" })); return; }
    if (a.resolution_code && entered !== a.resolution_code) {
      setErrors((e) => ({ ...e, [a.id]: "Code does not match. Confirm with the patient." }));
      return;
    }
    setErrors((e) => ({ ...e, [a.id]: "" }));
    setVerifying(a.id);
    await supabase.from("emergency_events").update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    } as never).eq("id", a.id);
    setVerifying(null);
    load();
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Emergency Alerts</h1>
        <span className="w-10" />
      </header>

      <div className="px-5 space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <HeartPulse className="mx-auto h-10 w-10 text-success" />
            <p className="mt-2 text-sm font-semibold">No alerts</p>
            <p className="text-xs text-muted-foreground">You'll be notified instantly when a linked patient triggers an emergency.</p>
          </div>
        )}
        {items.map((a) => {
          const snap = a.snapshot as { name?: string; age?: number; blood_type?: string; conditions?: string[]; emergency_contact_name?: string; emergency_contact_phone?: string };
          const resolved = !!a.resolved_at;
          return (
            <div key={a.id} className={`rounded-2xl p-4 shadow-card ${resolved ? "bg-surface" : "bg-destructive/5 ring-1 ring-destructive/30"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${resolved ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                  {resolved ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{snap.name || "Patient"} {snap.age ? `· ${snap.age}y` : ""} {snap.blood_type ? `· ${snap.blood_type}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.triggered_at).toLocaleString()}</div>
                </div>
              </div>
              {snap.conditions && snap.conditions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {snap.conditions.map((c) => <span key={c} className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">{c}</span>)}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {a.lat != null && a.lng != null && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                    <MapPin className="h-3.5 w-3.5" /> Open map
                  </a>
                )}
                {snap.emergency_contact_phone && (
                  <a href={`tel:${snap.emergency_contact_phone.replace(/\s/g, "")}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-success/15 px-3 py-2 text-xs font-semibold text-success">
                    <Phone className="h-3.5 w-3.5" /> Call contact
                  </a>
                )}
              </div>
              {!resolved && (
                <button onClick={() => resolve(a.id)} disabled={verifying === a.id}
                  className="mt-3 h-11 w-full rounded-xl bg-success text-sm font-semibold text-success-foreground disabled:opacity-60">
                  {verifying === a.id ? "Verifying…" : "Disable after verification"}
                </button>
              )}
              {resolved && (
                <p className="mt-3 text-center text-xs text-success">Resolved {new Date(a.resolved_at!).toLocaleString()}</p>
              )}
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
