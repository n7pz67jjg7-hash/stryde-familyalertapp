import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, MapPin, Phone, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { listContacts, type EmergencyContact } from "@/lib/contacts-store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency — STRYDE" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    kind: (s.kind as "manual" | "fall" | "auto") || "manual",
    risk: typeof s.risk === "number" ? s.risk : Number(s.risk) || 0,
  }),
  component: Emergency,
});

const COUNTDOWN_SECONDS = 10;

function Emergency() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/emergency" });
  const { geo, requestGeo } = useDeviceStatus();
  const { user, profile } = useAuth();
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [sent, setSent] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [resolutionCode, setResolutionCode] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const persisted = useRef(false);

  useEffect(() => {
    requestGeo();
    if (user) listContacts(user.id).then(setContacts).catch(() => {});
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if ("vibrate" in navigator) navigator.vibrate([400, 200, 400, 200, 400]);
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      audioRef.current = ctx;
      const beep = (t: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = "square";
        gain.gain.value = 0.08;
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.18);
      };
      [0, 0.4, 0.8].forEach(beep);
    } catch { /* noop */ }
    return () => { audioRef.current?.close().catch(() => {}); };
  }, []);

  const trigger = async () => {
    if (persisted.current) return;
    persisted.current = true;
    setSent(true);
    if (!user || !profile) return;
    const snapshot = {
      name: profile.full_name,
      age: profile.age,
      blood_type: profile.blood_type,
      conditions: profile.medical_conditions,
      medications: profile.medications,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
    };
    const { data } = await supabase.from("emergency_events").insert({
      patient_id: user.id,
      lat: geo.coords?.lat ?? null,
      lng: geo.coords?.lng ?? null,
      snapshot,
      kind: search.kind,
      risk_score: Math.round(search.risk),
    } as never).select("id, resolution_code").single();
    const row = data as { id: string; resolution_code: string } | null;
    if (row) { setEventId(row.id); setResolutionCode(row.resolution_code); }
  };

  useEffect(() => {
    if (sent || persisted.current) return;
    if (seconds <= 0) { trigger(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, sent]); // eslint-disable-line

  // Elapsed timer while active
  useEffect(() => {
    if (!sent || resolved) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [sent, resolved]);

  const imSafe = async () => {
    if (!sent) { navigate({ to: "/dashboard" }); return; }
    if (!eventId || !user) return;
    if (!confirm("Mark yourself as safe and close this alert?")) return;
    await supabase.from("emergency_events").update({
      resolved_at: new Date().toISOString(), resolved_by: user.id,
    } as never).eq("id", eventId);
    setResolved(true);
    if ("vibrate" in navigator) navigator.vibrate(0);
    setTimeout(() => navigate({ to: "/dashboard" }), 800);
  };

  const sendNow = () => { setSeconds(0); trigger(); };

  const priorityContact = contacts.find((c) => c.priority) ?? contacts[0];
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{resolved ? "Resolved" : sent ? "Emergency Active" : search.kind === "fall" ? "Possible Fall Detected" : "Emergency"}</h1>
        <span className="w-10" />
      </header>

      <div className="flex flex-1 flex-col items-center px-5">
        <div className="relative my-6 flex h-56 w-56 items-center justify-center">
          <div className={`absolute inset-0 rounded-full ${resolved ? "bg-success/10" : "bg-destructive/8"}`} />
          <div className={`absolute inset-6 rounded-full ${resolved ? "bg-success/15" : "bg-destructive/12"}`} />
          <div className={`absolute inset-12 rounded-full ${resolved ? "bg-success/25" : "bg-destructive/20"}`} />
          {!sent && <div className="pulse-ring absolute inset-16 rounded-full" />}
          <div className={`relative flex h-32 w-32 items-center justify-center rounded-full shadow-elevated ${resolved ? "bg-success" : "bg-destructive"}`}>
            {resolved ? (
              <ShieldCheck className="h-12 w-12 text-success-foreground" />
            ) : sent ? (
              <div className="text-center">
                <Timer className="mx-auto h-6 w-6 text-destructive-foreground" />
                <span className="block text-xl font-extrabold text-destructive-foreground tabular-nums">{mm}:{ss}</span>
              </div>
            ) : (
              <span className="text-5xl font-extrabold text-destructive-foreground tabular-nums">{seconds}</span>
            )}
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-foreground">
          {resolved ? "You're marked safe" : sent ? "Help is on the way" : <>Alerting in <span className="text-destructive">{seconds}s</span></>}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {resolved ? "Caregivers have been notified that the alert is resolved." :
           sent ? "Caregivers received your location, vitals, and medical profile." :
           "Tap 'I'm safe' to cancel, or 'Send help now' to alert immediately."}
        </p>

        {sent && !resolved && resolutionCode && (
          <div className="mt-4 w-full rounded-2xl bg-warning/10 p-4 text-center shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">Verification code</div>
            <div className="mt-1 text-3xl font-extrabold tracking-[0.4em] text-foreground">{resolutionCode}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Share with a caregiver to disable this alert.</div>
          </div>
        )}

        <div className="mt-4 w-full rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Live Location</div>
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-sm font-semibold">
            {geo.coords ? `${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)}` : geo.status === "denied" ? "Permission denied" : "Locating…"}
          </p>
          {geo.coords && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${geo.coords.lat},${geo.coords.lng}`} target="_blank" rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-primary">Open in Maps →</a>
          )}
        </div>

        {priorityContact && (
          <a href={`tel:${priorityContact.phone.replace(/\s/g, "")}`}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-success p-4 text-success-foreground shadow-card">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4" /> Call {priorityContact.name} now
            </span>
            <AlertCircle className="h-4 w-4" />
          </a>
        )}

        <div className="mt-6 mb-8 w-full space-y-2">
          {!sent ? (
            <>
              <button onClick={imSafe}
                className="h-14 w-full rounded-2xl bg-success font-semibold text-success-foreground shadow-elevated active:scale-[0.98]">
                I'm safe — cancel
              </button>
              <button onClick={sendNow}
                className="h-12 w-full rounded-2xl bg-destructive font-semibold text-destructive-foreground shadow-card active:scale-[0.98]">
                Send help now
              </button>
            </>
          ) : !resolved ? (
            <button onClick={imSafe}
              className="h-14 w-full rounded-2xl bg-success font-semibold text-success-foreground shadow-elevated active:scale-[0.98]">
              I'm safe — close alert
            </button>
          ) : (
            <button onClick={() => navigate({ to: "/dashboard" })}
              className="h-14 w-full rounded-2xl bg-primary font-semibold text-primary-foreground shadow-glow">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
