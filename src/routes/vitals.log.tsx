import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, Card } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VITAL_KINDS } from "@/lib/vitals";
import { toast } from "sonner";

export const Route = createFileRoute("/vitals/log")({
  head: () => ({
    meta: [
      { title: "Log a vital reading — STRYDE" },
      { name: "description", content: "Record blood pressure, heart rate, glucose, oxygen, temperature or weight." },
      { property: "og:title", content: "Log a vital reading — STRYDE" },
      { property: "og:description", content: "Record a new health measurement in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogVital,
});

function LogVital() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState(VITAL_KINDS[0]!.id);
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [note, setNote] = useState("");
  const spec = VITAL_KINDS.find((k) => k.id === kind)!;

  const save = async () => {
    if (!user) return toast.error("Sign in first");
    const value = Number(v1);
    if (!v1 || Number.isNaN(value)) return toast.error("Enter a valid value");
    const { error } = await supabase.from("vitals" as never).insert({
      patient_id: user.id,
      kind,
      value,
      value2: spec.dual && v2 ? Number(v2) : null,
      unit: spec.unit,
      note: note.trim() || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Reading saved");
    navigate({ to: "/vitals" });
  };

  const field = "w-full rounded-xl border border-border bg-background p-3 text-sm outline-none";

  return (
    <Screen title="Log reading" back="/vitals">
      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {VITAL_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                kind === k.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={field}
            inputMode="decimal"
            placeholder={spec.dual ? `Systolic (${spec.unit})` : `Value (${spec.unit})`}
            value={v1}
            onChange={(e) => setV1(e.target.value)}
          />
          {spec.dual && (
            <input
              className={field}
              inputMode="decimal"
              placeholder="Diastolic"
              value={v2}
              onChange={(e) => setV2(e.target.value)}
            />
          )}
        </div>
        <input className={field} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={save} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
          Save reading
        </button>
      </Card>
    </Screen>
  );
}
