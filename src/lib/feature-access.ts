import type { Profile, SubscriptionTier } from "@/hooks/useAuth";

export type PremiumFeature =
  | "voice_detection"
  | "smartwatch"
  | "heart_rate"
  | "family_dashboard"
  | "health_reports"
  | "blood_pressure";

export const PREMIUM_FEATURES: { id: PremiumFeature; name: string; desc: string }[] = [
  { id: "voice_detection", name: "Voice Emergency Detection", desc: "Trigger SOS hands-free with a keyword." },
  { id: "smartwatch", name: "Smartwatch Integration", desc: "Pair a wearable for fall + heart-rate." },
  { id: "heart_rate", name: "Heart Rate Monitoring", desc: "Live BPM and anomaly detection." },
  { id: "family_dashboard", name: "Family Dashboard", desc: "Multi-patient overview for caregivers." },
  { id: "health_reports", name: "Advanced Health Reports", desc: "Weekly AI-generated wellness summaries." },
  { id: "blood_pressure", name: "Blood Pressure Tracking", desc: "Track BP trends over time." },
];

export const COMING_SOON = [
  "Hospital Connectivity",
  "Ambulance Integration",
  "Medication Reminders",
  "AI Health Risk Prediction",
  "Multi-device Family Monitoring",
  "Emergency Voice Calls",
  "Fall Detection Optimization",
];

export function effectiveTier(p: Profile | null): SubscriptionTier {
  if (!p) return "free";
  if (p.trial_ends_at && new Date(p.trial_ends_at) > new Date()) return "premium";
  return p.subscription_tier;
}

export function canAccessFeature(profile: Profile | null, _feature: PremiumFeature): boolean {
  return effectiveTier(profile) === "premium";
}
