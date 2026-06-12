import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Copy, Check, Link2, ScanLine, Users, Trash2 } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/link")({
  head: () => ({ meta: [{ title: "Link — STRYDE" }] }),
  component: LinkPage,
});

interface LinkedPerson {
  id: string;
  name: string;
  link_id: string;
}

function LinkPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);
  if (!profile) return <MobileShell><div className="p-10 text-center text-sm">Loading…</div></MobileShell>;

  return profile.role === "patient" ? <PatientLink /> : <CaregiverLink />;
}

function PatientLink() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [caregivers, setCaregivers] = useState<LinkedPerson[]>([]);

  useEffect(() => {
    if (!profile?.patient_code) return;
    QRCode.toDataURL(`STRYDE:${profile.patient_code}`, { width: 260, margin: 1 }).then(setQr);
  }, [profile?.patient_code]);

  const loadCaregivers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("caregiver_patient_links")
      .select("id, caregiver_id, profiles!caregiver_patient_links_caregiver_id_fkey(full_name)")
      .eq("patient_id", user.id);
    // Fallback simpler query (no FK alias guaranteed)
    if (!data) {
      const { data: links } = await supabase.from("caregiver_patient_links").select("id, caregiver_id").eq("patient_id", user.id);
      const ids = (links || []).map((l) => l.caregiver_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        setCaregivers((links || []).map((l) => ({
          link_id: l.id, id: l.caregiver_id,
          name: profs?.find((p) => p.id === l.caregiver_id)?.full_name || "Caregiver",
        })));
      } else setCaregivers([]);
    }
  };
  useEffect(() => { loadCaregivers(); }, [user]); // eslint-disable-line

  const copy = () => {
    if (!profile?.patient_code) return;
    navigator.clipboard.writeText(profile.patient_code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const unlink = async (linkId: string) => {
    await supabase.from("caregiver_patient_links").delete().eq("id", linkId);
    loadCaregivers();
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">My Caregivers</h1>
        <span className="w-10" />
      </header>

      <div className="px-5">
        <div className="rounded-3xl bg-surface p-6 text-center shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your patient code</p>
          {qr ? <img src={qr} alt="QR" className="mx-auto mt-3 h-56 w-56 rounded-xl bg-white p-2" /> : <div className="mx-auto mt-3 h-56 w-56 animate-pulse rounded-xl bg-muted" />}
          <div className="mt-4 flex items-center justify-center gap-2 text-2xl font-bold tracking-[0.3em] text-primary">
            {profile?.patient_code || "—"}
          </div>
          <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy code"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Share this code or QR with your family. They'll scan or enter it in the STRYDE app.</p>
        </div>

        <h2 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked caregivers ({caregivers.length})</h2>
        {caregivers.length === 0 ? (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground shadow-card">No caregivers yet.</div>
        ) : (
          <ul className="space-y-2">
            {caregivers.map((c) => (
              <li key={c.link_id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Users className="h-5 w-5" />
                </div>
                <span className="flex-1 truncate font-semibold">{c.name}</span>
                <button onClick={() => unlink(c.link_id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

function CaregiverLink() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [patients, setPatients] = useState<LinkedPerson[]>([]);

  const loadPatients = async () => {
    if (!user) return;
    const { data: links } = await supabase.from("caregiver_patient_links").select("id, patient_id").eq("caregiver_id", user.id);
    const ids = (links || []).map((l) => l.patient_id);
    if (!ids.length) { setPatients([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    setPatients((links || []).map((l) => ({
      link_id: l.id, id: l.patient_id,
      name: profs?.find((p) => p.id === l.patient_id)?.full_name || "Patient",
    })));
  };
  useEffect(() => { loadPatients(); }, [user]); // eslint-disable-line

  const linkByCode = async (raw: string) => {
    if (!user) return;
    setBusy(true); setMsg(null);
    const clean = raw.replace(/^STRYDE:/, "").trim().toUpperCase();
    const { data: patient, error: pErr } = await supabase
      .from("profiles").select("id").eq("patient_code", clean).maybeSingle();
    if (pErr || !patient) { setMsg("Patient code not found."); setBusy(false); return; }
    const { error } = await supabase
      .from("caregiver_patient_links")
      .insert({ caregiver_id: user.id, patient_id: patient.id });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) { setMsg(error.message); return; }
    setMsg("Linked successfully ✓");
    setCode("");
    loadPatients();
  };

  const startScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          (text) => { stopScan(); linkByCode(text); },
          () => {},
        );
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Camera unavailable");
        setScanning(false);
      }
    }, 50);
  };
  const stopScan = async () => {
    try { await scannerRef.current?.stop(); await scannerRef.current?.clear(); } catch { /* noop */ }
    scannerRef.current = null;
    setScanning(false);
  };
  useEffect(() => () => { stopScan(); }, []); // eslint-disable-line

  const unlink = async (linkId: string) => {
    await supabase.from("caregiver_patient_links").delete().eq("id", linkId);
    loadPatients();
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Link a Patient</h1>
        <span className="w-10" />
      </header>

      <div className="px-5">
        <div className="rounded-3xl bg-surface p-5 shadow-card">
          {scanning ? (
            <>
              <div id="qr-reader" className="overflow-hidden rounded-2xl bg-black" />
              <button onClick={stopScan} className="mt-3 h-12 w-full rounded-xl border border-border font-semibold">Stop scanning</button>
            </>
          ) : (
            <button onClick={startScan} className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 font-semibold text-primary">
              <ScanLine className="h-8 w-8" />
              Scan patient QR
            </button>
          )}

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or enter code <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD2345"
              maxLength={8}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-center text-lg font-bold tracking-[0.3em] outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => linkByCode(code)} disabled={busy || code.length < 4}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow disabled:opacity-50">
              <Link2 className="h-5 w-5" />
            </button>
          </div>

          {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${msg.includes("✓") ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>{msg}</p>}
        </div>

        <h2 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">My patients ({patients.length})</h2>
        {patients.length === 0 ? (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground shadow-card">No patients linked yet.</div>
        ) : (
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.link_id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <span className="flex-1 truncate font-semibold">{p.name}</span>
                <button onClick={() => unlink(p.link_id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
