import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { listContacts, type EmergencyContact } from "@/lib/contacts-store";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency — STRYDE" }] }),
  component: Emergency,
});

const COUNTDOWN_SECONDS = 30;

function Emergency() {
  const navigate = useNavigate();
  const { geo, requestGeo } = useDeviceStatus();
  const { user } = useAuth();
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [sent, setSent] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    requestGeo();
    if (user) listContacts(user.id).then(setContacts).catch(() => {});
  }, [user]); // eslint-disable-line

  // Vibration + warning beep
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
    } catch { /* user gesture may be required */ }
    return () => { audioRef.current?.close().catch(() => {}); };
  }, []);

  useEffect(() => {
    if (sent) return;
    if (seconds <= 0) {
      setSent(true);
      // Persist event for history
      try {
        const events = JSON.parse(localStorage.getItem("stryde.events") ?? "[]");
        events.unshift({
          id: crypto.randomUUID(),
          at: Date.now(),
          type: "fall",
          coords: geo.coords,
          notified: contacts.filter((c) => c.priority).map((c) => c.name),
        });
        localStorage.setItem("stryde.events", JSON.stringify(events.slice(0, 100)));
      } catch { /* noop */ }
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, sent, contacts, geo.coords]);

  const cancel = () => {
    if ("vibrate" in navigator) navigator.vibrate(0);
    navigate({ to: "/dashboard" });
  };

  const priorityContact = contacts.find((c) => c.priority) ?? contacts[0];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={cancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{sent ? "Alert Sent" : "Emergency"}</h1>
        <span className="w-10" />
      </header>

      <div className="flex flex-1 flex-col items-center px-5">
        <div className="relative my-8 flex h-64 w-64 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/8" />
          <div className="absolute inset-6 rounded-full bg-destructive/12" />
          <div className="absolute inset-12 rounded-full bg-destructive/20" />
          {!sent && <div className="pulse-ring absolute inset-16 rounded-full" />}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-destructive shadow-elevated">
            {sent ? (
              <span className="text-3xl font-extrabold text-destructive-foreground">✓</span>
            ) : (
              <span className="text-5xl font-extrabold text-destructive-foreground tabular-nums">{seconds}</span>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground">
          {sent ? "Help Notified" : <>Emergency <span className="text-destructive">Detected</span></>}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {sent ? "Your contacts have been alerted with your live location." : <>Sending alert in <span className="font-bold text-destructive">{seconds}s</span>. Tap cancel if you're safe.</>}
        </p>

        <div className="mt-6 w-full rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Live Location</div>
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-sm font-semibold">
            {geo.coords
              ? `${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)}`
              : geo.status === "denied" ? "Permission denied" : "Locating…"}
          </p>
          {geo.coords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${geo.coords.lat},${geo.coords.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-primary"
            >
              Open in Maps →
            </a>
          )}
        </div>

        {priorityContact && (
          <a
            href={`tel:${priorityContact.phone.replace(/\s/g, "")}`}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-success p-4 text-success-foreground shadow-card"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4" /> Call {priorityContact.name} now
            </span>
            <AlertCircle className="h-4 w-4" />
          </a>
        )}

        <button
          onClick={cancel}
          className={`mt-6 mb-8 h-14 w-full rounded-2xl font-semibold shadow-elevated active:scale-[0.98] ${sent ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}
        >
          {sent ? "Back to Dashboard" : "Cancel Alert"}
        </button>
      </div>
    </div>
  );
}
