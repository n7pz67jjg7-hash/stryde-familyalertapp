import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/lab-results")({
  head: () => ({
    meta: [
      { title: "Lab results — STRYDE" },
      { name: "description", content: "Store blood tests and lab reports so any doctor can see them instantly." },
      { property: "og:title", content: "Lab results — STRYDE" },
      { property: "og:description", content: "Store blood tests and lab reports in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LabResults,
});

type Lab = {
  id: string;
  test_name: string;
  result: string;
  unit: string | null;
  reference_range: string | null;
  lab_name: string | null;
  taken_at: string;
};

function LabResults() {
  const { user } = useAuth();
  const [items, setItems] = useState<Lab[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ test_name: "", result: "", unit: "", reference_range: "", lab_name: "" });

  const load = async () => {
    const { data } = await supabase
      .from("lab_results" as never)
      .select("*")
      .order("taken_at", { ascending: false });
    setItems((data as unknown as Lab[]) || []);
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.test_name.trim() || !form.result.trim()) return toast.error("Test name and result are required");
    const { error } = await supabase.from("lab_results" as never).insert({
      patient_id: user.id,
      test_name: form.test_name.trim(),
      result: form.result.trim(),
      unit: form.unit.trim() || null,
      reference_range: form.reference_range.trim() || null,
      lab_name: form.lab_name.trim() || null,
    } as never);
    if (error) return toast.error(error.message);
    setForm({ test_name: "", result: "", unit: "", reference_range: "", lab_name: "" });
    setOpen(false);
    void load();
  };

  const field = "w-full rounded-xl border border-border bg-background p-3 text-sm outline-none";

  return (
    <Screen
      title="Lab results"
      subtitle="Your test history"
      action={
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Add result"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      {open && (
        <Card className="space-y-2">
          <input className={field} placeholder="Test name (e.g. HbA1c)" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
          <div className="flex gap-2">
            <input className={field} placeholder="Result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
            <input className={field} placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <input className={field} placeholder="Reference range" value={form.reference_range} onChange={(e) => setForm({ ...form, reference_range: e.target.value })} />
          <input className={field} placeholder="Lab name" value={form.lab_name} onChange={(e) => setForm({ ...form, lab_name: e.target.value })} />
          <button onClick={save} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Save result
          </button>
        </Card>
      )}

      {items.length === 0 && <Empty text="No lab results stored yet." />}
      {items.map((l) => (
        <Card key={l.id} className="space-y-1">
          <div className="flex items-start justify-between">
            <p className="flex items-center gap-1 text-sm font-semibold">
              <FlaskConical className="h-4 w-4 text-primary" /> {l.test_name}
            </p>
            <button
              onClick={async () => {
                await supabase.from("lab_results" as never).delete().eq("id", l.id);
                void load();
              }}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm">
            <span className="font-bold">{l.result}</span> {l.unit}
            {l.reference_range && <span className="text-xs text-muted-foreground"> (ref {l.reference_range})</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(l.taken_at).toLocaleDateString()} · {l.lab_name || "—"}
          </p>
        </Card>
      ))}
    </Screen>
  );
}
