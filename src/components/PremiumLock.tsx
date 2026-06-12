import { Crown, Lock, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { canAccessFeature, type PremiumFeature } from "@/lib/feature-access";
import { supabase } from "@/integrations/supabase/client";

export function PremiumFeatureCard({
  feature, name, desc, icon: Icon,
}: { feature: PremiumFeature; name: string; desc: string; icon: React.ComponentType<{ className?: string }> }) {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const unlocked = canAccessFeature(profile, feature);

  return (
    <>
      <button
        onClick={() => { if (!unlocked) setOpen(true); }}
        className="relative w-full overflow-hidden rounded-2xl bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.98]"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${unlocked ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              {!unlocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                  <Crown className="h-3 w-3" /> PREMIUM
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </div>
          {!unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && <UpgradeModal onClose={() => setOpen(false)} onTrial={refreshProfile} />}
    </>
  );
}

export function UpgradeModal({ onClose, onTrial }: { onClose: () => void; onTrial?: () => void }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const trialUsed = !!profile?.trial_ends_at;

  const startTrial = async () => {
    if (!user || trialUsed) return;
    setBusy(true);
    const endsAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("profiles").update({ trial_ends_at: endsAt }).eq("id", user.id);
    onTrial?.();
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-elevated animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
              <Crown className="h-5 w-5 text-warning-foreground" />
            </div>
            <h2 className="text-lg font-bold">Premium Feature Locked</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          Upgrade to STRYDE Premium to unlock advanced monitoring, smartwatch integration, voice detection,
          family dashboard, and health reports. New users receive a free 4-day trial.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={startTrial}
            disabled={busy || trialUsed}
            className="h-12 rounded-2xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {trialUsed ? "Trial Already Used" : busy ? "Starting…" : "Start Free Trial"}
          </button>
          <button
            onClick={() => { onClose(); navigate({ to: "/plans" }); }}
            className="h-12 rounded-2xl border border-border bg-surface font-semibold"
          >
            Upgrade Now
          </button>
          <button onClick={onClose} className="h-10 text-sm font-medium text-muted-foreground">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
