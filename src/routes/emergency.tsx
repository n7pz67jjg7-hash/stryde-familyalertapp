import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency — STRYDE" }] }),
  component: Emergency,
});

function Emergency() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Emergency</h1>
        <span className="w-6" />
      </header>

      <div className="flex flex-1 flex-col items-center px-5">
        <div className="relative my-10 flex h-64 w-64 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/10" />
          <div className="absolute inset-6 rounded-full bg-destructive/20" />
          <div className="absolute inset-12 rounded-full bg-destructive/30" />
          <div className="pulse-ring absolute inset-16 rounded-full" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-destructive shadow-elevated">
            <AlertCircle className="h-14 w-14 text-destructive-foreground" />
          </div>
        </div>

        <h2 className="text-2xl font-bold">
          Emergency <span className="text-destructive">Detected</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Help is on the way in <span className="font-bold text-primary">{seconds}s</span>
        </p>

        <div className="mt-6 w-full rounded-2xl bg-surface p-4">
          <div className="text-xs text-muted-foreground">Location</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug">
              123 Main St, Nasr City,<br />Cairo, Egypt
            </p>
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
          </div>
        </div>

        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-6 mb-8 h-14 w-full rounded-2xl bg-destructive font-semibold text-destructive-foreground shadow-elevated active:scale-[0.98]"
        >
          Cancel Alert
        </button>
      </div>
    </div>
  );
}
