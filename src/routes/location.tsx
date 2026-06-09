import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/location")({
  head: () => ({ meta: [{ title: "Live Location — STRYDE" }] }),
  component: LiveLocation,
});

function LiveLocation() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Live Location</h1>
        <span className="w-6" />
      </header>

      <div className="mx-5 overflow-hidden rounded-3xl">
        {/* Fake map */}
        <div className="relative h-72 w-full bg-[oklch(0.25_0.012_60)]">
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-40">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="oklch(0.45 0.01 60)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />
            <path d="M0 120 L400 130" stroke="oklch(0.55 0.015 60)" strokeWidth="6" />
            <path d="M180 0 L195 300" stroke="oklch(0.55 0.015 60)" strokeWidth="6" />
            <rect x="240" y="60" width="100" height="60" fill="oklch(0.38 0.08 150)" opacity="0.6" rx="4" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 -m-6 rounded-full bg-primary/20 animate-ping" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 rounded-2xl bg-surface p-4">
        <div className="text-xs text-muted-foreground">Current Location</div>
        <p className="mt-1 text-sm font-medium leading-snug">123 Main St, Nasr City,<br />Cairo, Egypt</p>
      </div>
      <div className="mx-5 mt-3 flex items-center justify-between rounded-2xl bg-surface p-4 text-sm">
        <span className="text-muted-foreground">Accuracy</span>
        <span className="font-semibold">5 m</span>
      </div>

      <div className="mt-auto px-5 pb-8 pt-6">
        <button className="h-14 w-full rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow">
          Share Location
        </button>
      </div>
    </div>
  );
}
