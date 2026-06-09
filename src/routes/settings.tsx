import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, User, Users, Bell, Settings as SettingsIcon, Info, ChevronRight, Crown } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — STRYDE" }] }),
  component: Settings,
});

type Row = { icon: typeof User; title: string; desc: string; to?: string };

const account: Row[] = [
  { icon: User, title: "Profile Information", desc: "Edit your personal details" },
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
      <ul className="overflow-hidden rounded-2xl bg-surface">
        {rows.map((r, i) => {
          const Icon = r.icon;
          const content = (
            <div className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
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
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-foreground"><ArrowLeft /></button>
        <h1 className="text-lg font-semibold">Settings</h1>
        <span className="w-6" />
      </header>

      <div className="px-5">
        <Link
          to="/plans"
          className="flex items-center gap-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/20">
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Upgrade to STRYDE+</div>
            <div className="text-xs opacity-90">Unlock advanced AI & family monitoring</div>
          </div>
          <ChevronRight />
        </Link>

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
