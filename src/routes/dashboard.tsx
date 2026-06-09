import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Menu, Bell, ShieldCheck, MapPin, Battery, Activity } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — STRYDE" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button className="text-foreground"><Menu /></button>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Link to="/notifications" className="relative text-foreground">
          <Bell />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
        </Link>
      </header>

      <div className="px-5">
        {/* Safe banner */}
        <div className="flex items-center gap-3 rounded-2xl bg-success/15 p-4 ring-1 ring-success/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-success-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-success">You are safe</div>
            <div className="text-xs text-success/80">All systems are normal</div>
          </div>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground">Live Status</h2>

        {/* Activity card */}
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Activity</div>
              <div className="mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                <span className="font-semibold">Normal</span>
              </div>
            </div>
            <svg viewBox="0 0 120 40" className="h-10 w-32 text-success">
              <path
                d="M0 25 L15 22 L25 30 L35 12 L50 24 L65 18 L80 28 L95 14 L110 22 L120 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 2 cards */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link to="/location" className="rounded-2xl bg-surface p-4">
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold">Live</span>
            </div>
          </Link>
          <div className="rounded-2xl bg-surface p-4">
            <div className="text-xs text-muted-foreground">Battery</div>
            <div className="mt-2 flex items-center gap-2">
              <Battery className="h-4 w-4 text-warning" />
              <span className="font-semibold">80%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface p-4 text-sm">
          <span className="text-muted-foreground">Last Update</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            Just now
          </span>
        </div>

        {/* Quick AI metric */}
        <div className="mt-3 rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">AI Risk Score</div>
              <div className="text-2xl font-bold text-primary">12<span className="text-sm text-muted-foreground">/100</span></div>
            </div>
            <div className="text-xs text-success">Low risk</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[12%] rounded-full bg-gradient-primary" />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
