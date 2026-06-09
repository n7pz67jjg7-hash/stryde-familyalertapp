import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — STRYDE" }] }),
  component: Plans,
});

const plans = [
  {
    id: "free",
    name: "STRYDE Free",
    price: "0",
    icon: Shield,
    accent: "border-border bg-surface",
    features: [
      "Basic fall detection",
      "One emergency contact",
      "Live GPS during emergencies",
      "Emergency history for 7 days",
    ],
  },
  {
    id: "plus",
    name: "STRYDE+",
    price: "49",
    icon: Sparkles,
    accent: "border-primary/40 bg-surface ring-2 ring-primary/30",
    badge: "Most Popular",
    features: [
      "Advanced AI fall detection",
      "Up to 5 family members",
      "Unlimited emergency history",
      "Real-time activity monitoring",
      "Priority notifications",
      "Health activity reports",
    ],
  },
  {
    id: "premium",
    name: "STRYDE Premium",
    price: "149",
    icon: Crown,
    accent: "border-warning/40 bg-surface",
    features: [
      "Everything in STRYDE+",
      "Voice emergency detection",
      "Smartwatch integration",
      "SMS + Push notifications",
      "Family monitoring dashboard",
      "Advanced AI risk prediction",
      "Cloud backup",
      "Premium support",
    ],
  },
];

function Plans() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/settings" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Choose Your Plan</h1>
        <span className="w-6" />
      </header>

      <p className="px-5 pb-4 text-sm text-muted-foreground">
        Pick the protection level that fits your family.
      </p>

      <div className="flex flex-col gap-4 px-5">
        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className={`relative rounded-3xl border p-5 ${p.accent}`}>
              {p.badge && (
                <span className="absolute -top-2 right-5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {p.badge}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.price === "0" ? "Free forever" : `${p.price} EGP / month`}
                  </div>
                </div>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-5 h-12 w-full rounded-2xl font-semibold ${
                  p.id === "plus"
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border border-border bg-surface-elevated text-foreground"
                }`}
              >
                {p.price === "0" ? "Current Plan" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
