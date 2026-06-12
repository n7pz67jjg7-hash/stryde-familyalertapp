import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, User, Users, Bell, Settings as SettingsIcon, Info, ChevronRight, Crown, Moon, Sun, LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, TIER_CONTACT_LIMIT } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — STRYDE" }] }),
  component: Settings,
});

type Row = { icon: typeof User; title: string; desc: string; to?: string };

const prefs: Row[] = [
  { icon: Bell, title: "Notifications", desc: "Manage notification settings", to: "/notifications" },
  { icon: SettingsIcon, title: "App Settings", desc: "General preferences" },
];
const about: Row[] = [
  { icon: Info, title: "About STRYDE", desc: "Version 1.4.0" },
];

const LANGUAGES = [
  { code: "en", name: "English", available: true },
  { code: "ar", name: "العربية", available: false },
  { code: "fr", name: "Français", available: false },
  { code: "de", name: "Deutsch", available: false },
  { code: "es", name: "Español", available: false },
  { code: "it", name: "Italiano", available: false },
  { code: "tr", name: "Türkçe", available: false },
  { code: "zh", name: "中文", available: false },
  { code: "ja", name: "日本語", available: false },
  { code: "ru", name: "Русский", available: false },
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
  const { user, profile, loading: authLoading } = useAuth();
  const [dark, setDark] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

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

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const tier = profile?.subscription_tier ?? "free";
  const limit = TIER_CONTACT_LIMIT[tier];

  const account: Row[] = [
    { icon: User, title: "Medical Profile", desc: "Blood type, conditions, contact", to: "/medical-profile" },
    { icon: Users, title: "Emergency Contacts", desc: `Up to ${limit === Infinity ? "unlimited" : limit} on ${tier.toUpperCase()}`, to: "/contacts" },
    { icon: Users, title: profile?.role === "caregiver" ? "Linked Patients" : "My Caregivers", desc: "Manage links and QR code", to: "/link" },
  ];

  const onLanguage = (code: string, available: boolean) => {
    if (!available) {
      alert("This language will be available in future updates.");
      return;
    }
    if (user) supabase.from("profiles").update({ language: code }).eq("id", user.id);
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
        {/* Profile card */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground">
            {(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate font-semibold">{profile?.full_name || "Your name"}</div>
            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {user?.email ?? "—"}
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${tier === "premium" ? "bg-warning/20 text-warning-foreground" : tier === "plus" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {tier}
          </span>
        </div>

        <Link
          to="/plans"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/25">
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{tier === "free" ? "Upgrade to STRYDE+" : tier === "plus" ? "Go Premium" : "Premium active"}</div>
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

        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="mt-6 mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-semibold text-destructive disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </MobileShell>
  );
}
