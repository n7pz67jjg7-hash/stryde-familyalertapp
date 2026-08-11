import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Check, Trash2 } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments/")({
  head: () => ({
    meta: [
      { title: "Appointments — STRYDE" },
      { name: "description", content: "Upcoming and past doctor appointments, shared with your caregiver." },
      { property: "og:title", content: "Appointments — STRYDE" },
      { property: "og:description", content: "Upcoming and past doctor appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppointmentsPage,
});

type Appt = {
  id: string;
  doctor_name: string;
  specialty: string | null;
  hospital_name: string | null;
  scheduled_at: string;
  status: string;
  notes: string | null;
};

function AppointmentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Appt[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments" as never)
      .select("*")
      .order("scheduled_at", { ascending: true });
    setItems((data as unknown as Appt[]) || []);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("appointments" as never).update({ status } as never).eq("id", id);
    toast.success(`Marked ${status}`);
    void load();
  };

  const remove = async (id: string) => {
    await supabase.from("appointments" as never).delete().eq("id", id);
    void load();
  };

  const now = Date.now();
  const upcoming = items.filter((a) => new Date(a.scheduled_at).getTime() >= now && a.status === "upcoming");
  const past = items.filter((a) => !upcoming.includes(a));

  return (
    <Screen
      title="Appointments"
      subtitle="Your clinic and hospital visits"
      action={
        <Link
          to="/appointments/new"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="New appointment"
        >
          <CalendarPlus className="h-4 w-4" />
        </Link>
      }
    >
      <h2 className="text-sm font-semibold">Upcoming</h2>
      {upcoming.length === 0 && <Empty text="No upcoming appointments." />}
      {upcoming.map((a) => (
        <Card key={a.id} className="space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">{a.doctor_name}</p>
              <p className="text-xs text-muted-foreground">
                {a.specialty || "General"} · {a.hospital_name || "—"}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {new Date(a.scheduled_at).toLocaleString()}
            </span>
          </div>
          {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setStatus(a.id, "completed")}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-muted py-2 text-xs font-medium"
            >
              <Check className="h-3.5 w-3.5 text-success" /> Completed
            </button>
            <button
              onClick={() => setStatus(a.id, "cancelled")}
              className="flex-1 rounded-xl bg-muted py-2 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </Card>
      ))}

      <h2 className="pt-2 text-sm font-semibold">History</h2>
      {past.length === 0 && <Empty text="No past appointments yet." />}
      {past.map((a) => (
        <Card key={a.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{a.doctor_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(a.scheduled_at).toLocaleDateString()} · {a.status}
            </p>
          </div>
          <button onClick={() => remove(a.id)} aria-label="Delete">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </Card>
      ))}
    </Screen>
  );
}
