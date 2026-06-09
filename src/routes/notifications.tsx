import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, MapPin, ShieldCheck, Battery } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — STRYDE" }] }),
  component: Notifications,
});

const items = [
  { icon: AlertCircle, color: "destructive", title: "Emergency Alert", time: "9:41 AM", desc: "An emergency was detected.", highlight: true },
  { icon: MapPin, color: "primary", title: "Location Shared", time: "9:40 AM", desc: "Location has been shared" },
  { icon: ShieldCheck, color: "success", title: "System Update", time: "9:35 AM", desc: "All systems are normal" },
  { icon: Battery, color: "warning", title: "Battery Status", time: "9:30 AM", desc: "Battery level is 80%" },
];

const colorMap: Record<string, string> = {
  destructive: "bg-destructive/15 text-destructive ring-destructive/30",
  primary: "bg-primary/15 text-primary ring-primary/30",
  success: "bg-success/15 text-success ring-success/30",
  warning: "bg-warning/15 text-warning ring-warning/30",
};

function Notifications() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-8">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Notifications</h1>
        <span className="w-6" />
      </header>
      <ul className="flex flex-col gap-3 px-5">
        {items.map((n, i) => {
          const Icon = n.icon;
          const ring = n.highlight ? "ring-1 ring-destructive/40" : "";
          return (
            <li key={i} className={`flex items-start gap-3 rounded-2xl bg-surface p-4 ${ring}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${colorMap[n.color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className={`font-semibold ${n.highlight ? "text-destructive" : ""}`}>{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.time}</div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
