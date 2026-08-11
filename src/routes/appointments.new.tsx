import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, Card } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments/new")({
  head: () => ({
    meta: [
      { title: "Book an appointment — STRYDE" },
      { name: "description", content: "Add a doctor appointment so your caregiver stays informed." },
      { property: "og:title", content: "Book an appointment — STRYDE" },
      { property: "og:description", content: "Add a doctor appointment to your care calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewAppointment,
});

const SPECIALTIES = [
  "General practice",
  "Cardiology",
  "Neurology",
  "Orthopaedics",
  "Endocrinology",
  "Nephrology",
  "Pulmonology",
  "Geriatrics",
  "Physiotherapy",
];

function NewAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]!);
  const [hospital, setHospital] = useState("");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user) return toast.error("Sign in first");
    if (!doctor.trim() || !when) return toast.error("Doctor name and date/time are required");
    setBusy(true);
    const { error } = await supabase.from("appointments" as never).insert({
      patient_id: user.id,
      doctor_name: doctor.trim(),
      specialty,
      hospital_name: hospital.trim() || null,
      scheduled_at: new Date(when).toISOString(),
      notes: notes.trim() || null,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment saved");
    navigate({ to: "/appointments" });
  };

  const field = "w-full rounded-xl border border-border bg-background p-3 text-sm outline-none";

  return (
    <Screen title="New appointment" back="/appointments">
      <Card className="space-y-3">
        <input className={field} placeholder="Doctor name" value={doctor} onChange={(e) => setDoctor(e.target.value)} />
        <select className={field} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          {SPECIALTIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input className={field} placeholder="Hospital or clinic" value={hospital} onChange={(e) => setHospital(e.target.value)} />
        <input className={field} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <textarea className={field} rows={3} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button
          disabled={busy}
          onClick={save}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save appointment"}
        </button>
      </Card>
    </Screen>
  );
}
