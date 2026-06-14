import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Bell, ShieldCheck, MapPin, Battery, Activity, Wifi, WifiOff, Cpu, Users, AlertTriangle, BatteryCharging, QrCode, HeartPulse, Mic, Watch, Heart, LayoutDashboard, FileBarChart2, Gauge, Sparkles, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useFallDetection } from "@/hooks/useFallDetection";
import { listContacts } from "@/lib/contacts-store";
import { useAuth, isProfileComplete } from "@/hooks/useAuth";
import { effectiveTier, COMING_SOON } from "@/lib/feature-access";
import { PremiumFeatureCard } from "@/components/PremiumLock";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (profile && profile.role === "patient" && !isProfileComplete(profile)) {
      navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, navigate]);

  if (!profile) return <MobileShell><div className="p-10 text-center text-sm">Loading…</div></MobileShell>;
  return profile.role === "caregiver" ? <CaregiverDashboard /> : <PatientDashboard />;
}

function PatientDashboard() {
  const navigate = useNavigate();
  const { battery, online, geo, motion, requestMotion, requestGeo } = useDeviceStatus();
  const { user, profile } = useAuth();
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const fall = useFallDetection(sensorEnabled && motion.permission !== "denied");
  const [contactsCount, setContactsCount] = useState(0);
  const tier = effectiveTier(profile);
  const trialDays = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  useEffect(() => { if (user) listContacts(user.id).then((c) => setContactsCount(c.length)).catch(() => {}); }, [user]);
  useEffect(() => { requestGeo(); }, []); // eslint-disable-line

  const enableSensors = async () => { await requestMotion(); setSensorEnabled(true); };

  const risk = fall.riskScore;
  const riskLevel = useMemo(() => {
    if (risk >= 90) return { label: "Fall detected", tone: "destructive" as const };
    if (risk >= 50) return { label: "Elevated", tone: "warning" as const };
    return { label: "Normal", tone: "success" as const };
  }, [risk]);
  const riskExplain = risk >= 90
    ? "Sudden free-fall followed by a sharp impact. Confirm you're okay."
    : risk >= 50
    ? "Unusual motion detected. We're watching closely."
    : "Movement looks normal. We'll alert you if anything changes.";

  // Auto-redirect to emergency on confirmed fall
  useEffect(() => {
    if (fall.fallDetected) {
      navigate({ to: "/emergency", search: { kind: "fall", risk } });
    }
  }, [fall.fallDetected]); // eslint-disable-line

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</p>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <Bell className="h-5 w-5" />
        </Link>
      </header>

      <div className="px-5 space-y-3 animate-fade-in">
        {/* Membership card */}
        <Link to="/plans" className={`flex items-center gap-3 rounded-2xl p-4 shadow-card ${tier === "premium" ? "bg-gradient-to-br from-warning/20 to-primary/10 ring-1 ring-warning/30" : "bg-surface"}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tier === "premium" ? "bg-warning text-warning-foreground" : tier === "plus" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {tier === "premium" ? <Crown className="h-5 w-5" /> : tier === "plus" ? <Sparkles className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="font-semibold">STRYDE {tier === "free" ? "Free" : tier === "plus" ? "Plus" : "Premium"}</div>
            <div className="text-xs text-muted-foreground">
              {profile?.trial_ends_at && trialDays > 0 ? `Trial · ${trialDays} day${trialDays === 1 ? "" : "s"} left` : tier === "free" ? "Upgrade for advanced AI monitoring" : "Thanks for supporting STRYDE"}
            </div>
          </div>
          <span className="text-xs font-semibold text-primary">View plans →</span>
        </Link>

        <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-card ${fall.fallDetected ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-success/10 ring-1 ring-success/20"}`}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${fall.fallDetected ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}`}>
            {fall.fallDetected ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className={`font-semibold ${fall.fallDetected ? "text-destructive" : "text-success"}`}>
              {fall.fallDetected ? "Possible fall detected" : "You are safe"}
            </div>
            <div className="text-xs text-muted-foreground">{fall.fallDetected ? "Open emergency to confirm" : "All systems monitoring"}</div>
          </div>
          {fall.fallDetected && (
            <Link to="/emergency" search={{ kind: "fall", risk }} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">Open</Link>
          )}
        </div>

        {/* Big SOS button */}
        <Link
          to="/emergency"
          search={{ kind: "manual", risk }}
          className="flex h-20 w-full items-center justify-center gap-3 rounded-2xl bg-destructive text-destructive-foreground shadow-elevated active:scale-[0.98]"
        >
          <AlertTriangle className="h-7 w-7" />
          <span className="text-xl font-extrabold tracking-wide">SOS — Send Help</span>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickLink to="/link" icon={QrCode} label="My Caregivers" sub={profile?.patient_code ?? ""} />
          <QuickLink to="/medical-profile" icon={HeartPulse} label="Medical Profile" sub="Edit info" />
        </div>

        <h2 className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Device Status</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatusCard icon={battery.charging ? BatteryCharging : Battery} label="Battery"
            value={battery.level != null ? `${battery.level}%` : "—"}
            sub={battery.charging ? "Charging" : battery.supported ? "On battery" : "Not supported"}
            tone={batteryColor(battery.level)} />
          <StatusCard icon={online ? Wifi : WifiOff} label="Internet"
            value={online ? "Connected" : "Offline"} sub={online ? "Network OK" : "Limited mode"}
            tone={online ? "text-success" : "text-destructive"} />
          <StatusCard icon={MapPin} label="GPS"
            value={geo.status === "granted" ? "Active" : geo.status === "denied" ? "Denied" : geo.status === "requesting" ? "…" : "Idle"}
            sub={geo.coords ? `±${Math.round(geo.coords.accuracy)}m` : "Tap to allow"}
            tone={geo.status === "granted" ? "text-success" : geo.status === "denied" ? "text-destructive" : "text-warning"}
            onClick={geo.status !== "granted" ? requestGeo : undefined} />
          <StatusCard icon={Cpu} label="Sensors"
            value={sensorEnabled && motion.permission !== "denied" ? "Live" : "Off"}
            sub={motion.supported ? (motion.permission === "denied" ? "Permission denied" : "Accel + Gyro") : "Unsupported"}
            tone={sensorEnabled && motion.permission !== "denied" ? "text-success" : "text-muted-foreground"}
            onClick={!sensorEnabled ? enableSensors : undefined} />
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">AI Risk Score</div>
              <div className="mt-1 text-3xl font-bold text-primary">
                {risk}<span className="text-base text-muted-foreground">/100</span>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskLevel.tone === "destructive" ? "bg-destructive/15 text-destructive" : riskLevel.tone === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-success/15 text-success"}`}>
              {riskLevel.label}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${risk}%` }} />
          </div>
          {!sensorEnabled && (
            <button onClick={enableSensors} className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              Enable Motion Sensors
            </button>
          )}
        </div>

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

        {/* Premium features */}
        <h2 className="pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Premium Features</h2>
        <div className="space-y-2">
          <PremiumFeatureCard feature="voice_detection" name="Voice Emergency Detection" desc="Trigger SOS hands-free." icon={Mic} />
          <PremiumFeatureCard feature="smartwatch" name="Smartwatch Integration" desc="Pair a wearable." icon={Watch} />
          <PremiumFeatureCard feature="heart_rate" name="Heart Rate Monitoring" desc="Live BPM tracking." icon={Heart} />
          <PremiumFeatureCard feature="family_dashboard" name="Family Dashboard" desc="Multi-patient view." icon={LayoutDashboard} />
          <PremiumFeatureCard feature="health_reports" name="Advanced Health Reports" desc="Weekly AI summaries." icon={FileBarChart2} />
          <PremiumFeatureCard feature="blood_pressure" name="Blood Pressure Tracking" desc="Trends over time." icon={Gauge} />
        </div>

        {/* Coming soon */}
        <h2 className="pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming Soon</h2>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <ul className="grid grid-cols-1 gap-1.5 text-sm">
            {COMING_SOON.map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MobileShell>
  );
}

function CaregiverDashboard() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState<{ id: string; name: string; }[]>([]);
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase.from("caregiver_patient_links").select("patient_id").eq("caregiver_id", user.id);
      const ids = (links || []).map((l) => l.patient_id);
      if (!ids.length) { setPatients([]); return; }
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setPatients((profs || []).map((p) => ({ id: p.id, name: p.full_name || "Patient" })));
      const { count } = await supabase.from("emergency_events").select("*", { count: "exact", head: true }).is("resolved_at", null);
      setOpenCount(count ?? 0);
    })();
    const channel = supabase
      .channel("caregiver-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_events" }, () => {
        supabase.from("emergency_events").select("*", { count: "exact", head: true }).is("resolved_at", null).then(({ count }) => setOpenCount(count ?? 0));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Caregiver</p>
          <h1 className="text-xl font-bold">Hi, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        </div>
        <Link to="/alerts" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <Bell className="h-5 w-5" />
          {openCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{openCount}</span>}
        </Link>
      </header>

      <div className="space-y-3 px-5">
        <Link to="/alerts" className={`flex items-center gap-3 rounded-2xl p-4 shadow-card ${openCount > 0 ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-success/10 ring-1 ring-success/20"}`}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${openCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}`}>
            {openCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className={`font-semibold ${openCount > 0 ? "text-destructive" : "text-success"}`}>
              {openCount > 0 ? `${openCount} active alert${openCount === 1 ? "" : "s"}` : "All patients safe"}
            </div>
            <div className="text-xs text-muted-foreground">Real-time monitoring active</div>
          </div>
        </Link>

        <Link to="/link" className="flex items-center justify-between rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/25"><QrCode className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">Link a new patient</div>
              <div className="text-xs opacity-90">Scan QR or enter code</div>
            </div>
          </div>
        </Link>

        <h2 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">My patients ({patients.length})</h2>
        {patients.length === 0 ? (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground shadow-card">
            No patients yet. <Link to="/link" className="font-semibold text-primary">Link one now →</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary"><Users className="h-5 w-5" /></div>
                <span className="flex-1 font-semibold">{p.name}</span>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">SAFE</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

function StatusCard({ icon: Icon, label, value, sub, tone, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; tone: string; onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className="rounded-2xl bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </Comp>
  );
}

function QuickLink({ to, icon: Icon, label, sub }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <Link to={to} className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-2 text-sm font-semibold">{label}</div>
      <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
    </Link>
  );
}
