import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "plus" | "premium";
export type AppRole = "patient" | "caregiver";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  subscription_tier: SubscriptionTier;
  trial_ends_at: string | null;
  role: AppRole;
  age: number | null;
  gender: string | null;
  blood_type: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string[];
  medications: string[];
  language: string;
  onboarded_at: string | null;
  patient_code: string | null;
}

export function isProfileComplete(p: Profile | null): boolean {
  if (!p) return false;
  if (p.role === "caregiver") return !!p.full_name;
  return !!(
    p.full_name &&
    p.age &&
    p.gender &&
    p.blood_type &&
    p.emergency_contact_name &&
    p.emergency_contact_phone &&
    p.onboarded_at
  );
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => fetchProfile(s.user.id), 0);
      else setProfile(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (data) setProfile(data as unknown as Profile);
  };

  return {
    session,
    user,
    profile,
    loading,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}

export const TIER_CONTACT_LIMIT: Record<SubscriptionTier, number> = {
  free: 2,
  plus: 5,
  premium: Infinity,
};
