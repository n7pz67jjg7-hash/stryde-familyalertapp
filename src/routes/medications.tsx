import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, BellOff, Check, Pill, Plus, Trash2, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/medications")({
  head: () => ({ meta: [{ title: "Medications — STRYDE" }] }),
  component: MedicationsPage,
});

type Med = {
  id: string;
  patient_id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  reminder_time: string | null; // "HH:MM:SS"
  active: boolean;
  notes: string | null;
};

type LogStatus = "taken" | "missed" | "snoozed";

function MedicationsPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [logsToday, setLogsToday] = useState<Record<string, LogStatus>>({});
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Med | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPerm("unsupported");
    } else {
      setNotifPerm(Notification.permission);
    }
  }, []);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data: m } = await supabase
      .from("medications" as any)
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    setMeds((m as any) || []);

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data: l } = await supabase
      .from("medication_logs" as any)
      .select("medication_id,status,taken_at")
      .eq("patient_id", user.id)
      .gte("taken_at", start.toISOString());
    const map: Record<string, LogStatus> = {};
    (l as any[] | null)?.forEach((row) => { map[row.medication_id] = row.status; });
    setLogsToday(map);
    setBusy(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  // Reminder ticker: check each minute for any active med whose reminder_time matches now and not yet logged today
  useEffect(() => {
    if (notifPerm !== "granted") return;
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const current = `${hh}:${mm}`;
      meds.forEach((m) => {
        if (!m.active || !m.reminder_time) return;
        if (logsToday[m.id]) return;
        const t = m.reminder_time.slice(0, 5);
        if (t === current) {
          try {
            new Notification("Medication reminder", {
              body: `${m.name}${m.dose ? " — " + m.dose : ""}`,
              tag: `med-${m.id}-${now.toDateString()}`,
            });
            // soft beep
            const a = new Audio("data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
            a.play().catch(() => {});
          } catch {}
        }
      });
    };
    const id = setInterval(tick, 60_000);
    tick();
    return () => clearInterval(id);
  }, [meds, logsToday, notifPerm]);

  const askPermission = async () => {
    if (notifPerm === "unsupported") return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  const log = async (med: Med, status: LogStatus) => {
    if (!user) return;
    await supabase.from("medication_logs" as any).insert({
      medication_id: med.id, patient_id: user.id, status,
    } as any);
    setLogsToday((prev) => ({ ...prev, [med.id]: status }));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this medication?")) return;
    await supabase.from("medications" as any).delete().eq("id", id);
    setMeds((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleActive = async (m: Med) => {
    const next = !m.active;
    await supabase.from("medications" as any).update({ active: next } as any).eq("id", m.id);
    setMeds((prev) => prev.map((x) => x.id === m.id ? { ...x, active: next } : x));
  };

  const upcoming = useMemo(() =>
    meds.filter((m) => m.active).sort((a, b) => (a.reminder_time || "").localeCompare(b.reminder_time || "")),
    [meds]
  );

  if (profile?.role === "caregiver") {
    navigate({ to: "/dashboard" });
    return null;
  }

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Medications</h1>
        <button onClick={() => { setEditing(null); setShowAdd(true); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="space-y-4 px-5">
        {notifPerm !== "granted" && notifPerm !== "unsupported" && (
          <button onClick={askPermission} className="flex w-full items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-left">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Bell className="h-4 w-4" /> Enable reminder notifications
            </span>
            <span className="text-xs text-primary/70">Tap to allow</span>
          </button>
        )}
        {notifPerm === "unsupported" && (
          <div className="rounded-2xl bg-warning/10 px-4 py-3 text-xs text-warning">
            Notifications aren't available in this browser. Reminders won't ring.
          </div>
        )}

        {busy && meds.length === 0 && <p className="text-center text-sm text-muted-foreground">Loading…</p>}

        {!busy && meds.length === 0 && (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <Pill className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="text-base font-semibold">No medications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add your first medication to schedule reminders and track adherence.</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Add medication
            </button>
          </div>
        )}

        {upcoming.map((m) => {
          const logged = logsToday[m.id];
          return (
            <div key={m.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <h3 className="truncate text-base font-semibold">{m.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[m.dose, m.frequency].filter(Boolean).join(" • ") || "No dose set"}
                    {m.reminder_time ? ` • ${m.reminder_time.slice(0, 5)}` : ""}
                  </p>
                  {m.notes && <p className="mt-1 text-xs text-muted-foreground">{m.notes}</p>}
                </div>
                <button onClick={() => toggleActive(m)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground" aria-label="Toggle">
                  {m.active ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {logged ? (
                  <span className={`flex-1 rounded-xl px-3 py-2 text-center text-xs font-medium ${
                    logged === "taken" ? "bg-success/15 text-success" :
                    logged === "missed" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                  }`}>Today: {logged}</span>
                ) : (
                  <>
                    <button onClick={() => log(m, "taken")} className="flex-1 rounded-xl bg-success/15 px-3 py-2 text-xs font-semibold text-success">
                      <Check className="mr-1 inline h-3.5 w-3.5" /> Taken
                    </button>
                    <button onClick={() => log(m, "snoozed")} className="flex-1 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                      Snooze
                    </button>
                    <button onClick={() => log(m, "missed")} className="flex-1 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      Missed
                    </button>
                  </>
                )}
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => { setEditing(m); setShowAdd(true); }} className="text-xs text-primary hover:underline">Edit</button>
                <button onClick={() => remove(m.id)} className="text-xs text-destructive hover:underline">
                  <Trash2 className="mr-1 inline h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          );
        })}

        {meds.filter((m) => !m.active).length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inactive</h2>
            {meds.filter((m) => !m.active).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm shadow-card opacity-70">
                <span>{m.name}</span>
                <button onClick={() => toggleActive(m)} className="text-xs text-primary hover:underline">Reactivate</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <MedEditor
          initial={editing}
          patientId={user!.id}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); load(); }}
        />
      )}
    </MobileShell>
  );
}

function MedEditor({ initial, patientId, onClose, onSaved }: {
  initial: Med | null; patientId: string; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [dose, setDose] = useState(initial?.dose || "");
  const [frequency, setFrequency] = useState(initial?.frequency || "Once daily");
  const [reminder, setReminder] = useState((initial?.reminder_time || "08:00").slice(0, 5));
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr(null);
    const payload: any = {
      patient_id: patientId,
      name: name.trim(),
      dose: dose.trim() || null,
      frequency: frequency.trim() || null,
      reminder_time: reminder ? `${reminder}:00` : null,
      notes: notes.trim() || null,
      active: true,
    };
    const { error } = initial
      ? await supabase.from("medications" as any).update(payload).eq("id", initial.id)
      : await supabase.from("medications" as any).insert(payload);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-background p-5 pb-8 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit medication" : "Add medication"}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Metformin" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dose" value={dose} onChange={setDose} placeholder="500 mg" />
            <Field label="Frequency" value={frequency} onChange={setFrequency} placeholder="Once daily" />
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Reminder time</span>
            <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Take with food"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          {err && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
          <button onClick={save} disabled={saving}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save changes" : "Add medication"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
