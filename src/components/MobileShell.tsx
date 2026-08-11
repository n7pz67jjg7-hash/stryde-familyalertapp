import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Settings, ShieldAlert, Bell, QrCode, Pill } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type Tab = { to: string; label: string; icon: typeof Home };

const PATIENT_TABS: Tab[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/medications", label: "Meds", icon: Pill },
  { to: "/link", label: "Family", icon: QrCode },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

const CAREGIVER_TABS: Tab[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/link", label: "Patients", icon: QrCode },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileShell({
  children, showNav = true, showSos,
}: {
  children: ReactNode; showNav?: boolean; showSos?: boolean;
}) {
  const { location } = useRouterState();
  const { profile } = useAuth();
  const path = location.pathname;
  const isCaregiver = profile?.role === "caregiver";
  const tabs = isCaregiver ? CAREGIVER_TABS : PATIENT_TABS;
  const sosVisible = showSos ?? !isCaregiver;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-28">{children}</main>

      {sosVisible && (
        <Link
          to="/emergency"
          search={{ kind: "manual" as const, risk: 0 }}
          aria-label="Trigger SOS"
          className="fixed bottom-24 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-elevated transition-transform active:scale-95"
          style={{ boxShadow: "0 14px 40px -10px oklch(0.6 0.22 25 / 0.55)" }}
        >
          <div className="pulse-ring absolute inset-0 rounded-full" />
          <ShieldAlert className="relative h-7 w-7" />
        </Link>
      )}

      {showNav && (
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur">
          <ul className="flex items-stretch justify-around px-2 pt-2 pb-3">
            {tabs.map(({ to, label, icon: Icon }) => {
              const active = path === to || (to !== "/dashboard" && path.startsWith(to));
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                    <span className={active ? "font-semibold" : ""}>{label}</span>
                    {active && <span className="h-0.5 w-6 rounded-full bg-primary" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
