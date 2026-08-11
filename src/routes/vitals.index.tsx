import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Plus } from "lucide-react";
import { Screen, Card, Empty } from "@/components/Screen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VITAL_KINDS } from "@/lib/vitals";

export const Route = createFileRoute("/vitals/")({
  head: () => ({
    meta: [
      { title: "Vitals tracking — STRYDE" },
      { name: "description", content: "Blood pressure, heart rate, glucose, oxygen and weight trends over time." },
      { property: "og:title", content: "Vitals tracking — STRYDE" },
      { property: "og:description", content: "Track blood pressure, heart rate, glucose and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VitalsPage,
});



type Vital = {
  id: string;
  kind: string;
  value: number;
  value2: number | null;
  unit: string | null;
  recorded_at: string;
  note: string | null;
};

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / range) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-24 text-primary">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function VitalsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Vital[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("vitals" as never)
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(200);
      setItems((data as unknown as Vital[]) || []);
    })();
  }, [user]);

  const byKind = useMemo(() => {
    const m: Record<string, Vital[]> = {};
    items.forEach((v) => {
      (m[v.kind] = m[v.kind] || []).push(v);
    });
    return m;
  }, [items]);

  return (
    <Screen
      title="Vitals"
      subtitle="Your health measurements"
      action={
        <Link
          to="/vitals/log"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Log a vital"
        >
          <Plus className="h-4 w-4" />
        </Link>
      }
    >
      {items.length === 0 && <Empty text="No readings yet. Tap + to log your first measurement." />}
      {VITAL_KINDS.map((k) => {
        const list = byKind[k.id];
        if (!list?.length) return null;
        const latest = list[0]!;
        const series = [...list].slice(0, 12).reverse().map((v) => Number(v.value));
        return (
          <Card key={k.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-primary" /> {k.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(latest.recorded_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {latest.value}
                  {latest.value2 ? `/${latest.value2}` : ""}{" "}
                  <span className="text-xs font-normal text-muted-foreground">{k.unit}</span>
                </p>
                <Spark points={series} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {list.slice(0, 6).map((v) => (
                <span key={v.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {new Date(v.recorded_at).toLocaleDateString()}: {v.value}
                  {v.value2 ? `/${v.value2}` : ""}
                </span>
              ))}
            </div>
          </Card>
        );
      })}
    </Screen>
  );
}
