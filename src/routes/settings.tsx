import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, User, Users, Bell, Settings as SettingsIcon, Info, ChevronRight, Crown, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — STRYDE" }] }),
  component: Settings,
});

type Row = { icon: typeof User; title: string; desc: string; to?: string };

const account: Row[] = [
  { icon: User, title: "Medical Profile", desc: "Allergies, blood type, conditions" },
  { icon: Users, title: "Emergency Contacts", desc: "Manage your contacts", to: "/contacts" },
];
const prefs: Row[] = [
  { icon: Bell, title: "Notifications", desc: "Manage notification settings", to: "/notifications" },
  { icon: SettingsIcon, title: "App Settings", desc: "General preferences" },
];
const about: Row[] = [
  { icon: Info, title: "About STRYDE", desc: "Version 1.0.0" },
];

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <>
      <h2 className="mt-6 mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">{title}</h2>
      <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {rows.map((r, i) => {
          const Icon = r.icon;
          const content = (
            <div className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
          return (
            <li key={r.title}>
              {r.to ? <Link to={r.to}>{content}</Link> : <button className="w-full text-left">{content}</button>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Settings() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("stryde.theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("stryde.theme", next ? "dark" : "light");
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Settings</h1>
        <span className="w-10" />
      </header>

      <div className="px-5">
        <Link
          to="/plans"
          className="flex items-center gap-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/25">
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Upgrade to STRYDE+</div>
            <div className="text-xs opacity-90">Unlock advanced AI & family monitoring</div>
          </div>
          <ChevronRight />
        </Link>

        <h2 className="mt-6 mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Appearance</h2>
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Dark Mode</div>
            <div className="text-xs text-muted-foreground">{dark ? "On" : "Off"} · easy on the eyes at night</div>
          </div>
          <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dark ? "bg-primary" : "bg-muted"}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : "translate-x-1"}`} />
          </span>
        </button>

        <Section title="Account" rows={account} />
        <Section title="Preferences" rows={prefs} />
        <Section title="About" rows={about} />

        <button className="mt-6 mb-4 h-12 w-full rounded-2xl border border-destructive/40 text-sm font-semibold text-destructive">
          Log out
        </button>
      </div>
    </MobileShell>
  );
}
