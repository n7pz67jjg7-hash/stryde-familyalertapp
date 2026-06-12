import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/medical-profile")({
  head: () => ({ meta: [{ title: "Medical Profile — STRYDE" }] }),
  component: MedicalProfile,
});

const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Previous Stroke", "Epilepsy", "Asthma", "Other"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function MedicalProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setAge(profile.age?.toString() || "");
    setGender(profile.gender || "");
    setBloodType(profile.blood_type || "");
    setWeight(profile.weight_kg?.toString() || "");
    setHeight(profile.height_cm?.toString() || "");
    setConditions(profile.medical_conditions || []);
    setMedications((profile.medications || []).join(", "));
    setEcName(profile.emergency_contact_name || "");
    setEcPhone(profile.emergency_contact_phone || "");
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      age: age ? parseInt(age) : null,
      gender: gender || null,
      blood_type: bloodType || null,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      medical_conditions: conditions,
      medications: medications.split(",").map((m) => m.trim()).filter(Boolean),
      emergency_contact_name: ecName.trim() || null,
      emergency_contact_phone: ecPhone.trim() || null,
      onboarded_at: profile?.onboarded_at ?? new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    setMsg(error ? error.message : "Saved ✓");
    if (!error) await refreshProfile();
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Medical Profile</h1>
        <span className="w-10" />
      </header>

      <div className="space-y-4 px-5">
        <Section title="Personal">
          <Input label="Full name" value={fullName} onChange={setFullName} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" value={age} onChange={setAge} />
            <Input label="Gender" value={gender} onChange={setGender} placeholder="Male / Female / Other" />
          </div>
        </Section>

        <Section title="Vitals">
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Blood type</span>
            <div className="flex flex-wrap gap-2">
              {BLOOD.map((b) => (
                <button key={b} onClick={() => setBloodType(b)}
                  className={`rounded-full px-3 py-1.5 text-sm ${bloodType === b ? "bg-primary text-primary-foreground" : "border border-border bg-surface"}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Weight (kg)" type="number" value={weight} onChange={setWeight} />
            <Input label="Height (cm)" type="number" value={height} onChange={setHeight} />
          </div>
        </Section>

        <Section title="Conditions">
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => {
              const on = conditions.includes(c);
              return (
                <button key={c} onClick={() => setConditions((prev) => on ? prev.filter((x) => x !== c) : [...prev, c])}
                  className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "border border-border bg-surface"}`}>
                  {c}
                </button>
              );
            })}
          </div>
          <Input label="Medications (comma-separated)" value={medications} onChange={setMedications} />
        </Section>

        <Section title="Emergency Contact">
          <Input label="Name" value={ecName} onChange={setEcName} />
          <Input label="Phone" type="tel" value={ecPhone} onChange={setEcPhone} />
        </Section>

        {msg && <p className={`rounded-xl px-3 py-2 text-xs ${msg.includes("✓") ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>{msg}</p>}

        <button onClick={save} disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
          <Save className="h-5 w-5" /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
