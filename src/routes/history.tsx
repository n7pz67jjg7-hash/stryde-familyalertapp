import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, ChevronLeft, ChevronRight, Bell, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — STRYDE" }] }),
  component: History,
});

const days = ["S","M","T","W","T","F","S"];
const weeks = [
  ["", "", "", 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, ""],
];

const events = [
  { icon: Bell, color: "destructive", title: "Emergency Detected", date: "May 16, 2024 · 9:41 AM" },
  { icon: MapPin, color: "primary", title: "Location Shared", date: "May 16, 2024 · 9:40 AM" },
  { icon: ShieldCheck, color: "success", title: "System Normal", date: "May 16, 2024 · 9:35 AM" },
];

const ringMap: Record<string, string> = {
  destructive: "bg-destructive/15 text-destructive ring-destructive/30",
  primary: "bg-primary/15 text-primary ring-primary/30",
  success: "bg-success/15 text-success ring-success/30",
};

function History() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">History</h1>
        <span className="w-6" />
      </header>

      <div className="mx-5 rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-sm font-semibold">May 2024</span>
          <button className="text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
          {days.map((d, i) => <span key={i} className="text-muted-foreground">{d}</span>)}
          {weeks.flat().map((d, i) => {
            const isHighlight = d === 16;
            const isMarked = d === 9 || d === 29;
            return (
              <span
                key={i}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${
                  isHighlight ? "bg-primary text-primary-foreground font-bold" :
                  isMarked ? "text-primary font-semibold" : "text-foreground"
                }`}
              >
                {d}
              </span>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3 px-5">
        {events.map((e, i) => {
          const Icon = e.icon;
          return (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${ringMap[e.color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${e.color === "destructive" ? "text-destructive" : ""}`}>{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.date}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}
