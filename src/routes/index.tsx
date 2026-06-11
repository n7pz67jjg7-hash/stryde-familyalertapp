import { createFileRoute, Link } from "@tanstack/react-router";
import { StrydeLogo } from "@/components/StrydeLogo";
import { Brain, MapPin, Bell, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STRYDE — AI Emergency Detection" },
      { name: "description", content: "AI-powered fall detection and family safety. STRYDE alerts your loved ones the moment something goes wrong." },
      { property: "og:title", content: "STRYDE — AI Emergency Detection" },
      { property: "og:description", content: "AI-powered fall detection and family safety." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, color: "bg-primary text-primary-foreground", title: "AI-Powered", desc: "Detects abnormal movements in real-time" },
  { icon: MapPin, color: "bg-success text-success-foreground", title: "Live Tracking", desc: "Shares your location instantly" },
  { icon: Bell, color: "bg-destructive text-destructive-foreground", title: "Instant Alerts", desc: "Notifies loved ones immediately" },
  { icon: ShieldCheck, color: "bg-info text-info-foreground", title: "Your Safety", desc: "Advanced technology, peace of mind" },
];

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-hero">
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-10 text-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 30%, oklch(0.74 0.18 50 / 0.35), transparent 70%)",
          }}
        />
        <div className="relative">
          <StrydeLogo size={108} />
        </div>
        <h1 className="relative mt-6 text-4xl font-extrabold tracking-tight text-primary">
          STRYDE
        </h1>
        <p className="relative mt-3 text-base text-muted-foreground">
          We've got your back<br />when it matters most.
        </p>

        <div className="relative mt-10 flex w-full flex-col gap-3">
          <Link
            to="/auth"
            className="flex h-14 items-center justify-center rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            Get Started
          </Link>
          <Link
            to="/auth"
            className="flex h-14 items-center justify-center rounded-2xl border border-border bg-surface font-semibold text-foreground transition-colors active:bg-surface-elevated"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="rounded-3xl bg-surface p-5">
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs leading-snug text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Because your safety is our mission.
        </p>
      </section>
    </div>
  );
}
