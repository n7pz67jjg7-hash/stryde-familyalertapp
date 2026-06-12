import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { effectiveTier } from "@/lib/feature-access";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — STRYDE" }] }),
  component: Plans,
});

const plans = [
  {
    id: "free" as const,
    name: "STRYDE Free",
    price: "0",
    icon: Shield,
    accent: "border-border bg-surface",
    features: [
      "Fall detection",
      "GPS location sharing",
      "Basic alerts",
      "2 emergency contacts",
    ],
  },
  {
    id: "plus" as const,
    name: "STRYDE+",
    price: "70",
    icon: Sparkles,
    accent: "border-primary/40 bg-surface ring-2 ring-primary/30",
    badge: "Most Popular",
    features: [
      "Voice detection",
      "5 emergency contacts",
      "Alert history",
      "Advanced AI monitoring",
    ],
  },
  {
    id: "premium" as const,
    name: "STRYDE Premium",
    price: "149",
    icon: Crown,
    accent: "border-warning/40 bg-surface",
    features: [
      "Smartwatch integration",
      "Heart rate monitoring",
      "Family dashboard",
      "Unlimited contacts",
      "Advanced health reports",
      "Future healthcare integrations",
    ],
  },
];

function Plans() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const currentTier = effectiveTier(profile);
  const trialUsed = !!profile?.trial_ends_at;

  const subscribe = async (tier: "free" | "plus" | "premium") => {
    if (!user) return;
    setBusy(tier);
    // Simulated subscription change — Stripe wiring deferred.
    await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", user.id);
    await refreshProfile();
    setBusy(null);
  };

  const startTrial = async () => {
    if (!user || trialUsed) return;
    setBusy("trial");
    const endsAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("profiles").update({ trial_ends_at: endsAt }).eq("id", user.id);
    await refreshProfile();
    setBusy(null);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/settings" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Choose Your Plan</h1>
        <span className="w-6" />
      </header>

      {!trialUsed && (
        <div className="mx-5 mb-4 rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2 font-semibold"><Crown className="h-5 w-5" /> 4-day Premium trial</div>
          <p className="mt-1 text-xs opacity-90">Unlock every feature for free. No card required.</p>
          <button onClick={startTrial} disabled={busy === "trial"} className="mt-3 h-10 w-full rounded-xl bg-background/25 text-sm font-semibold disabled:opacity-60">
            {busy === "trial" ? "Starting…" : "Start Free Trial"}
          </button>
        </div>
      )}

      <p className="px-5 pb-4 text-sm text-muted-foreground">Pick the protection level that fits your family.</p>

      <div className="flex flex-col gap-4 px-5">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentTier === p.id;
          return (
            <div key={p.id} className={`relative rounded-3xl border p-5 ${p.accent}`}>
              {p.badge && (
                <span className="absolute -top-2 right-5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">{p.badge}</span>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.price === "0" ? "Free forever" : `${p.price} EGP / month`}</div>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(p.id)}
                disabled={isCurrent || busy === p.id}
                className={`mt-5 h-12 w-full rounded-2xl font-semibold disabled:opacity-60 ${p.id === "plus" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "border border-border bg-surface-elevated text-foreground"}`}
              >
                {isCurrent ? "Current Plan" : busy === p.id ? "Updating…" : p.id === "free" ? "Downgrade" : "Subscribe"}
              </button>
            </div>
          );
        })}
        <p className="text-center text-[11px] text-muted-foreground">Real payments via Visa, Mastercard, and Fawry coming soon. Subscriptions are simulated for now.</p>
      </div>
    </div>
  );
}
