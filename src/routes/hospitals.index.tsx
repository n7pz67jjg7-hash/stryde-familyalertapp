import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Loader2, Phone, Search } from "lucide-react";
import { Screen, Card, Empty, Stars } from "@/components/Screen";
import { searchHospitals, type Hospital } from "@/lib/hospitals.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/hospitals/")({
  head: () => ({
    meta: [
      { title: "Egypt Hospital Directory — STRYDE" },
      {
        name: "description",
        content:
          "Find hospitals across Egypt with real Google user ratings plus reviews from the STRYDE community.",
      },
      { property: "og:title", content: "Egypt Hospital Directory — STRYDE" },
      {
        property: "og:description",
        content: "Real hospital ratings across Egypt, plus STRYDE community reviews.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HospitalsPage,
});

const CITIES = [
  "Egypt",
  "Cairo",
  "Giza",
  "Alexandria",
  "New Cairo",
  "6th of October",
  "Mansoura",
  "Tanta",
  "Aswan",
  "Luxor",
  "Port Said",
  "Suez",
  "Ismailia",
  "Hurghada",
  "Sharm El Sheikh",
  "Assiut",
  "Zagazig",
  "Fayoum",
];

function HospitalsPage() {
  const search = useServerFn(searchHospitals);
  const { user } = useAuth();
  const [city, setCity] = useState("Cairo");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [strydeRatings, setStrydeRatings] = useState<Record<string, { avg: number; n: number }>>({});
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const run = async (nextCity = city, nextQ = q) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await search({ data: { city: nextCity, query: nextQ } });
      setList(res.hospitals);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("hospital_reviews" as never).select("place_id, rating");
      const acc: Record<string, { sum: number; n: number }> = {};
      ((data as unknown as { place_id: string; rating: number }[]) || []).forEach((r) => {
        acc[r.place_id] = acc[r.place_id] || { sum: 0, n: 0 };
        acc[r.place_id]!.sum += r.rating;
        acc[r.place_id]!.n += 1;
      });
      setStrydeRatings(
        Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.n, n: v.n }])),
      );
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("hospital_favorites" as never)
        .select("place_id")
        .eq("user_id", user.id);
      setFavs(new Set(((data as unknown as { place_id: string }[]) || []).map((f) => f.place_id)));
    })();
  }, [user]);

  const toggleFav = async (h: Hospital) => {
    if (!user) return toast.error("Sign in to save hospitals");
    if (favs.has(h.id)) {
      await supabase
        .from("hospital_favorites" as never)
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", h.id);
      setFavs((s) => new Set([...s].filter((x) => x !== h.id)));
    } else {
      await supabase
        .from("hospital_favorites" as never)
        .insert({ user_id: user.id, place_id: h.id, place_name: h.name, address: h.address } as never);
      setFavs((s) => new Set(s).add(h.id));
      toast.success("Saved to your hospitals");
    }
  };

  const sorted = useMemo(
    () => [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [list],
  );

  return (
    <Screen title="Hospitals in Egypt" subtitle="Real Google ratings + STRYDE reviews">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Search e.g. cardiac, children, Cleopatra"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCity(c);
                void run(c);
              }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                c === city ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading hospitals…
        </div>
      )}
      {err && <Empty text={err} />}
      {!loading && !err && sorted.length === 0 && <Empty text="No hospitals found for this search." />}

      <div className="space-y-3">
        {sorted.map((h) => {
          const s = strydeRatings[h.id];
          return (
            <Card key={h.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/hospitals/$placeId"
                  params={{ placeId: h.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-foreground">{h.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{h.address}</p>
                </Link>
                <button
                  onClick={() => toggleFav(h)}
                  aria-label="Save hospital"
                  className="rounded-full bg-muted p-2"
                >
                  <Heart
                    className={`h-4 w-4 ${favs.has(h.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                  />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Stars value={h.rating ?? 0} />
                  <span className="font-medium text-foreground">{h.rating?.toFixed(1) ?? "—"}</span>
                  <span className="text-muted-foreground">({h.userRatingCount ?? 0} Google)</span>
                </span>
                {s && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    STRYDE {s.avg.toFixed(1)} · {s.n}
                  </span>
                )}
                {h.openNow !== null && (
                  <span className={h.openNow ? "text-success" : "text-muted-foreground"}>
                    {h.openNow ? "Open now" : "Closed"}
                  </span>
                )}
              </div>
              {h.phone && (
                <a
                  href={`tel:${h.phone}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <Phone className="h-3.5 w-3.5" /> {h.phone}
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
