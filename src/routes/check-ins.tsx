import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartHandshake, Smile } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/check-ins")({
  head: () => ({
    meta: [
      { title: "Daily check-in — STRYDE" },
      { name: "description", content: "Tell your family you are OK with one tap, every day." },
      { property: "og:title", content: "Daily check-in — STRYDE" },
      { property: "og:description", content: "One-tap daily reassurance for your family." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckIns,
});

type CheckIn = { id: string; status: string; note: string | null; created_at: string };

const STATUSES = [
  { id: "ok", label: "I'm fine", tone: "bg-success/10 text-success" },
  { id: "tired", label: "Tired", tone: "bg-warning/10 text-warning" },
  { id: "unwell", label: "Not well", tone: "bg-destructive/10 text-destructive" },
];

function CheckIns() {
  const { user } = useAuth();
  const [items, setItems] = useState<CheckIn[]>([]);
  const [note, setNote] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("check_ins" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as unknown as CheckIn[]) || []);
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const submit = async (status: string) => {
    if (!user) return toast.error("Sign in first");
    const { error } = await supabase
      .from("check_ins" as never)
      .insert({ patient_id: user.id, status, note: note.trim() || null } as never);
    if (error) return toast.error(error.message);
    setNote("");
    toast.success("Your family has been updated");
    void load();
  };

  const streak = (() => {
    let s = 0;
    const days = new Set(items.map((i) => new Date(i.created_at).toDateString()));
    const d = new Date();
    while (days.has(d.toDateString())) {
      s += 1;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  return (
    <Screen title="Daily check-in" subtitle="Reassure your family in one tap">
      <Card className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <HeartHandshake className="h-4 w-4 text-primary" /> Check-in streak
        </p>
        <span className="text-lg font-bold text-primary">{streak} days</span>
      </Card>

      <Card className="space-y-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a short note (optional)"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
        />
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              onClick={() => submit(s.id)}
              className={`rounded-xl py-3 text-xs font-semibold ${s.tone}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <h2 className="text-sm font-semibold">Recent check-ins</h2>
      {items.length === 0 && <Empty text="No check-ins yet." />}
      {items.map((c) => (
        <Card key={c.id} className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-sm font-medium capitalize">
              <Smile className="h-4 w-4 text-primary" /> {c.status}
            </p>
            {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
          </div>
          <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
        </Card>
      ))}
    </Screen>
  );
}
