import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Bell, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — STRYDE" }] }),
  component: HistoryPage,
});

interface EventRecord {
  id: string;
  at: number;
  type: "fall" | "location" | "ok";
  coords?: { lat: number; lng: number } | null;
  notified?: string[];
}

function HistoryPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stryde.events");
      const list: EventRecord[] = raw ? JSON.parse(raw) : [];
      // also include a couple of synthetic ok-events so empty state isn't bleak
      setEvents(list);
    } catch { setEvents([]); }
  }, []);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Emergency History</h1>
        <span className="w-10" />
      </header>

      <div className="px-5">
        <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="text-xs opacity-90">Total events</div>
          <div className="mt-1 text-3xl font-bold">{events.length}</div>
          <div className="text-xs opacity-80">All emergencies, alerts and pings</div>
        </div>

        {events.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-surface p-8 text-center shadow-card">
            <ShieldCheck className="mx-auto h-10 w-10 text-success" />
            <p className="mt-3 text-sm font-semibold">No emergencies recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">Your safety log is clean.</p>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {events.map((e) => {
              const Icon = e.type === "fall" ? AlertCircle : e.type === "location" ? MapPin : Bell;
              const toneCls = e.type === "fall" ? "bg-destructive/15 text-destructive" : e.type === "location" ? "bg-primary/15 text-primary" : "bg-success/15 text-success";
              return (
                <li key={e.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3 shadow-card animate-fade-in">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneCls}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold capitalize">{e.type === "fall" ? "Fall detected" : e.type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</div>
                    {e.coords && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${e.coords.lat},${e.coords.lng}`}
                        target="_blank" rel="noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-primary"
                      >
                        View location →
                      </a>
                    )}
                    {e.notified && e.notified.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">Notified: {e.notified.join(", ")}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
