import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, MapPin, Navigation, Phone } from "lucide-react";
import { Screen, Card, Empty, Stars } from "@/components/Screen";
import { getHospital, type Hospital } from "@/lib/hospitals.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/hospitals/$placeId")({
  head: () => ({
    meta: [
      { title: "Hospital details — STRYDE" },
      { name: "description", content: "Hospital ratings, reviews, contact and directions." },
      { property: "og:title", content: "Hospital details — STRYDE" },
      { property: "og:description", content: "Hospital ratings, reviews, contact and directions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalDetail,
});

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function HospitalDetail() {
  const { placeId } = Route.useParams();
  const load = useServerFn(getHospital);
  const { user } = useAuth();
  const [h, setH] = useState<Hospital | null>(null);
  const [gReviews, setGReviews] = useState<
    { author: string; rating: number; text: string; when: string }[]
  >([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("hospital_reviews" as never)
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });
    setReviews((data as unknown as Review[]) || []);
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await load({ data: { placeId } });
        setH(res.hospital);
        setGReviews(res.googleReviews);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load hospital");
      } finally {
        setLoading(false);
      }
    })();
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  const submit = async () => {
    if (!user) return toast.error("Sign in to review");
    const { error } = await supabase.from("hospital_reviews" as never).upsert(
      {
        place_id: placeId,
        place_name: h?.name ?? "",
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      } as never,
      { onConflict: "place_id,user_id" } as never,
    );
    if (error) return toast.error(error.message);
    setComment("");
    toast.success("Thanks for your review");
    void loadReviews();
  };

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  if (loading)
    return (
      <Screen title="Hospital" back="/hospitals">
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </Screen>
    );

  if (err || !h)
    return (
      <Screen title="Hospital" back="/hospitals">
        <Empty text={err ?? "Hospital not found."} />
      </Screen>
    );

  return (
    <Screen title={h.name} subtitle={h.address} back="/hospitals">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Google rating</p>
            <div className="flex items-center gap-2">
              <Stars value={h.rating ?? 0} size={16} />
              <span className="text-sm font-semibold">{h.rating?.toFixed(1) ?? "—"}</span>
              <span className="text-xs text-muted-foreground">({h.userRatingCount ?? 0})</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">STRYDE rating</p>
            <p className="text-sm font-semibold text-primary">
              {reviews.length ? `${avg.toFixed(1)} · ${reviews.length}` : "No reviews yet"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <a
            href={h.phone ? `tel:${h.phone}` : "#"}
            className="flex flex-col items-center gap-1 rounded-xl bg-muted py-2 font-medium"
          >
            <Phone className="h-4 w-4 text-primary" /> Call
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-xl bg-muted py-2 font-medium"
          >
            <Navigation className="h-4 w-4 text-primary" /> Directions
          </a>
          <a
            href={h.website ?? h.mapsUri ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-xl bg-muted py-2 font-medium"
          >
            <Globe className="h-4 w-4 text-primary" /> Website
          </a>
        </div>
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {h.address}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold">Rate this hospital</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`h-9 w-9 rounded-full text-sm font-semibold ${
                n <= rating ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Share your experience (optional)"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
        />
        <button
          onClick={submit}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Submit review
        </button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">STRYDE community reviews</h2>
        {reviews.length === 0 && <Empty text="Be the first STRYDE user to review this hospital." />}
        {reviews.map((r) => (
          <Card key={r.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
          </Card>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Google reviews</h2>
        {gReviews.length === 0 && <Empty text="No Google reviews available." />}
        {gReviews.map((r, i) => (
          <Card key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{r.author}</span>
              <Stars value={r.rating} />
            </div>
            <p className="line-clamp-4 text-sm text-muted-foreground">{r.text}</p>
            <p className="text-[11px] text-muted-foreground">{r.when}</p>
          </Card>
        ))}
      </section>
    </Screen>
  );
}
