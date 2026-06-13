import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, HeartPulse } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Setup — STRYDE" }] }),
  component: Onboarding,
});

const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Previous Stroke", "Epilepsy", "Asthma", "Kidney Disease", "Liver Disease", "Other"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

function csv(s: string) { return s.split(",").map((x) => x.trim()).filter(Boolean); }

function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [allergiesDrug, setAllergiesDrug] = useState("");
  const [allergiesFood, setAllergiesFood] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
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
    setPhone((profile as any).phone || "");
    setNationalId((profile as any).national_id || "");
    setAddress((profile as any).address || "");
    setBloodType(profile.blood_type || "");
    setWeight(profile.weight_kg?.toString() || "");
    setHeight(profile.height_cm?.toString() || "");
    setConditions(profile.medical_conditions || []);
    setMedications((profile.medications || []).join(", "));
    setAllergiesDrug(((profile as any).allergies_drug || []).join(", "));
    setAllergiesFood(((profile as any).allergies_food || []).join(", "));
    setMedicalNotes((profile as any).medical_notes || "");
    setEcName(profile.emergency_contact_name || "");
    setEcPhone(profile.emergency_contact_phone || "");
  }, [profile]);

  if (!user || !profile) return <div className="p-10 text-center text-sm">Loading…</div>;

  if (profile.role === "caregiver") {
    navigate({ to: "/dashboard" });
    return null;
  }

  const toggle = (c: string) =>
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const TOTAL_STEPS = 5;
  const stepValid = () => {
    if (step === 0) return fullName.trim() && age && gender && phone.trim();
    if (step === 1) return bloodType;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return ecName.trim() && ecPhone.trim();
    return false;
  };

  const next = async () => {
    if (!stepValid()) { setErr("Please complete the required fields."); return; }
    setErr(null);
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      age: parseInt(age),
      gender,
      phone: phone.trim() || null,
      national_id: nationalId.trim() || null,
      address: address.trim() || null,
      blood_type: bloodType,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      medical_conditions: conditions,
      medications: csv(medications),
      allergies_drug: csv(allergiesDrug),
      allergies_food: csv(allergiesFood),
      medical_notes: medicalNotes.trim() || null,
      emergency_contact_name: ecName.trim(),
      emergency_contact_phone: ecPhone.trim(),
      onboarded_at: new Date().toISOString(),
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    await refreshProfile();
    navigate({ to: "/dashboard" });
  };

  const TITLES = ["Personal info", "Vitals", "Conditions & medications", "Allergies & notes", "Emergency contact"];
  const SUBS = ["Tell us about yourself", "Help responders treat you", "Pre-existing conditions help in emergencies", "Critical for safe treatment", "We'll alert this person first"];

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card disabled:opacity-40">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <span className="w-10" />
      </header>

      <div className="px-5">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <HeartPulse className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Medical Profile</span>
        </div>
        <h1 className="text-2xl font-bold">{TITLES[step]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{SUBS[step]}</p>

        <div className="mt-6 space-y-3">
          {step === 0 && (
            <>
              <TextField label="Full name *" value={fullName} onChange={setFullName} placeholder="Your name" />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Age *" value={age} onChange={setAge} placeholder="42" type="number" />
                <ChipGroup label="Gender *" options={GENDERS} value={gender} onChange={setGender} />
              </div>
              <TextField label="Phone *" value={phone} onChange={setPhone} placeholder="+20 100 000 0000" type="tel" />
              <TextField label="National ID" value={nationalId} onChange={setNationalId} placeholder="14-digit ID" />
              <TextField label="Home address" value={address} onChange={setAddress} placeholder="Street, city" />
            </>
          )}
          {step === 1 && (
            <>
              <ChipGroup label="Blood type *" options={BLOOD} value={bloodType} onChange={setBloodType} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" type="number" />
                <TextField label="Height (cm)" value={height} onChange={setHeight} placeholder="170" type="number" />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medical conditions</span>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const on = conditions.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggle(c)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-foreground"}`}>
                        {on && <Check className="h-3.5 w-3.5" />} {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <TextField label="Medications (comma-separated)" value={medications} onChange={setMedications} placeholder="Aspirin, Metformin" />
              <p className="text-xs text-muted-foreground">Tip: add doses & reminders later from the Medications page.</p>
            </>
          )}
          {step === 3 && (
            <>
              <TextField label="Drug allergies" value={allergiesDrug} onChange={setAllergiesDrug} placeholder="Penicillin, Aspirin" />
              <TextField label="Food allergies" value={allergiesFood} onChange={setAllergiesFood} placeholder="Peanuts, Shellfish" />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Additional medical notes</span>
                <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} rows={4}
                  placeholder="Implants, recent surgery, anything responders should know"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </>
          )}
          {step === 4 && (
            <>
              <TextField label="Contact name *" value={ecName} onChange={setEcName} placeholder="Spouse, sibling…" />
              <TextField label="Contact phone *" value={ecPhone} onChange={setEcPhone} placeholder="+20 100 000 0000" type="tel" />
            </>
          )}
        </div>

        {err && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}

        <button
          onClick={next}
          disabled={saving}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? "Saving…" : step < TOTAL_STEPS - 1 ? "Continue" : "Finish setup"} <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function ChipGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`rounded-full px-3 py-2 text-sm ${value === o ? "bg-primary text-primary-foreground" : "bg-surface border border-border"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
