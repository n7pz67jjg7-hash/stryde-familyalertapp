import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Bell, ShieldCheck, MapPin, Battery, Activity, Wifi, WifiOff, Cpu, Users, AlertTriangle, BatteryCharging } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useFallDetection } from "@/hooks/useFallDetection";
import { loadContacts } from "@/lib/contacts-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — STRYDE" }] }),
  component: Dashboard,
});

function batteryColor(level: number | null): string {
  if (level == null) return "text-muted-foreground";
  if (level > 50) return "text-success";
  if (level >= 20) return "text-warning";
  return "text-destructive";
}

function Dashboard() {
  const { battery, online, geo, motion, requestMotion, requestGeo } = useDeviceStatus();
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const fall = useFallDetection(sensorEnabled && motion.permission !== "denied");
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => { setContactsCount(loadContacts().length); }, []);
  useEffect(() => { requestGeo(); /* prompt once */ }, []); // eslint-disable-line

  const enableSensors = async () => {
    await requestMotion();
    setSensorEnabled(true);
  };

  const risk = fall.riskScore;
  const riskLevel = useMemo(() => {
    if (risk >= 70) return { label: "High risk", tone: "destructive" as const };
    if (risk >= 30) return { label: "Moderate", tone: "warning" as const };
    return { label: "Low risk", tone: "success" as const };
  }, [risk]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Link>
      </header>

      <div className="px-5 space-y-3 animate-fade-in">
        {/* Safety banner */}
        <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-card ${fall.fallDetected ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-success/10 ring-1 ring-success/20"}`}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${fall.fallDetected ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}`}>
            {fall.fallDetected ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className={`font-semibold ${fall.fallDetected ? "text-destructive" : "text-success"}`}>
              {fall.fallDetected ? "Possible fall detected" : "You are safe"}
            </div>
            <div className="text-xs text-muted-foreground">
              {fall.fallDetected ? "Open emergency to confirm or cancel" : "All systems monitoring"}
            </div>
          </div>
          {fall.fallDetected && (
            <Link to="/emergency" className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">
              Open
            </Link>
          )}
        </div>

        {/* Live status grid */}
        <h2 className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Device Status</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            icon={battery.charging ? BatteryCharging : Battery}
            label="Battery"
            value={battery.level != null ? `${battery.level}%` : "—"}
            sub={battery.charging ? "Charging" : battery.supported ? "On battery" : "Not supported"}
            tone={batteryColor(battery.level)}
          />
          <StatusCard
            icon={online ? Wifi : WifiOff}
            label="Internet"
            value={online ? "Connected" : "Offline"}
            sub={online ? "Network OK" : "Limited mode"}
            tone={online ? "text-success" : "text-destructive"}
          />
          <StatusCard
            icon={MapPin}
            label="GPS"
            value={geo.status === "granted" ? "Active" : geo.status === "denied" ? "Denied" : geo.status === "requesting" ? "…" : "Idle"}
            sub={geo.coords ? `±${Math.round(geo.coords.accuracy)}m` : "Tap to allow"}
            tone={geo.status === "granted" ? "text-success" : geo.status === "denied" ? "text-destructive" : "text-warning"}
            onClick={geo.status !== "granted" ? requestGeo : undefined}
          />
          <StatusCard
            icon={Cpu}
            label="Sensors"
            value={sensorEnabled && motion.permission !== "denied" ? "Live" : "Off"}
            sub={motion.supported ? (motion.permission === "denied" ? "Permission denied" : "Accel + Gyro") : "Unsupported"}
            tone={sensorEnabled && motion.permission !== "denied" ? "text-success" : "text-muted-foreground"}
            onClick={!sensorEnabled ? enableSensors : undefined}
          />
        </div>

        {/* Risk score */}
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">AI Risk Score</div>
              <div className="mt-1 text-3xl font-bold text-primary">
                {risk}<span className="text-base text-muted-foreground">/100</span>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold bg-${riskLevel.tone}/15 text-${riskLevel.tone}`}>
              {riskLevel.label}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all"
              style={{ width: `${risk}%` }}
            />
          </div>
          {!sensorEnabled && (
            <button onClick={enableSensors} className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              Enable Motion Sensors
            </button>
          )}
        </div>

        {/* Live activity */}
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Live Activity</div>
              <div className="mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <span className="font-semibold">{fall.lastMagnitude.toFixed(1)} m/s²</span>
              </div>
            </div>
            <ActivitySpark data={fall.history} />
          </div>
        </div>

        {/* Contacts shortcut */}
        <Link to="/contacts" className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Emergency Contacts</div>
              <div className="text-xs text-muted-foreground">{contactsCount} configured</div>
            </div>
          </div>
          <span className="text-sm font-semibold text-primary">Manage</span>
        </Link>
      </div>
    </MobileShell>
  );
}

function StatusCard({
  icon: Icon, label, value, sub, tone, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; tone: string; onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="rounded-2xl bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </Comp>
  );
}

function ActivitySpark({ data }: { data: { magnitude: number }[] }) {
  if (data.length < 2) {
    return <div className="h-10 w-32 rounded bg-muted/40" />;
  }
  const w = 128, h = 40;
  const max = Math.max(20, ...data.map((d) => d.magnitude));
  const pts = data.slice(-30).map((d, i, arr) => {
    const x = (i / (arr.length - 1)) * w;
    const y = h - (d.magnitude / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-32 text-accent">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
