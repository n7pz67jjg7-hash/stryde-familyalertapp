# STRYDE v1.4 — Healthcare Ecosystem Upgrade

This is a large, multi-phase upgrade on top of the existing v1.3 (Lovable Cloud auth + contacts already shipped). I'll keep the current architecture and extend it — no rebuild. Because the scope is huge, I'll ship it in 4 phases and stop for your approval between each.

---

## Phase 1 — Data model + roles (foundation)

**DB migration (Lovable Cloud):**
- `app_role` enum: `patient | caregiver` + `user_roles` table (security-definer `has_role` fn, per the platform's role pattern).
- Extend `profiles`: `role`, `age`, `gender`, `blood_type`, `weight_kg`, `height_cm`, `emergency_contact_name`, `emergency_contact_phone`, `medical_conditions text[]`, `medications text[]`, `language`, `onboarded_at`, `patient_code` (short unique code for QR linking — patients only).
- `caregiver_patient_links (caregiver_id, patient_id, created_at)` with RLS so caregiver sees their patients and patient sees their caregivers.
- `emergency_events (id, patient_id, triggered_at, coords, snapshot jsonb, resolved_at, resolved_by)` — snapshot freezes name/age/blood/conditions/contact at trigger time.
- Realtime enabled on `emergency_events` + `caregiver_patient_links`.
- GRANTs + RLS policies on every new public table.

**Code:**
- `useAuth` extended with `role` + `medicalProfileComplete`.
- Sign-up flow asks role (Patient / Caregiver). Profile trigger seeds row with role + generated `patient_code` for patients.

## Phase 2 — Medical profile + setup wizard + linking

- `/onboarding` wizard (forced on first launch if profile incomplete; cannot skip required fields, autosaves per step):
  1. Personal info (name, age, gender)
  2. Vitals (blood type, weight, height)
  3. Conditions (Diabetes / Hypertension / Heart Disease / Stroke / Epilepsy / Asthma / Other) + Medications free-list
  4. Emergency contact (name + phone)
- `/medical-profile` — edit anytime, same fields.
- Patient `/link` page: shows QR (rendered from `patient_code` with `qrcode` lib) + 8-char code, copy button.
- Caregiver `/link` page: scan QR (camera) **or** enter code → creates row in `caregiver_patient_links`.
- Caregiver dashboard: list of linked patients with live status badge.

## Phase 3 — Emergency broadcast + caregiver monitoring

- Update `/emergency` (patient): on fire, insert `emergency_events` row with frozen medical snapshot + coords. Realtime fans out to caregivers.
- Caregiver `/alerts` page: real-time list, opens detail with map link, patient medical snapshot, call button, "Mark Resolved" (requires confirmation — "Disable after verification").
- Browser Notification API + sound + vibration for caregivers when an event arrives.
- Emergency history stored server-side per patient, viewable by patient and their caregivers.

## Phase 4 — Premium gating + i18n + polish

- `canAccessFeature(profile, feature)` helper + `<PremiumLock>` wrapper component (renders crown + opens upgrade modal).
- Update `/plans` page with the 3 tiers + EGP pricing + "Start Free Trial" (sets `trial_ends_at = now + 4 days`, tier → premium during trial).
- Lock the 6 listed premium features in UI (Voice Detection, Smartwatch, Heart Rate, Family Dashboard, Health Reports, BP Tracking) — visible with lock badge, click → modal.
- "Coming Soon" section on dashboard with the 7 future features.
- i18n: `useLanguage` hook with EN + AR (RTL) implemented; FR/DE/ES/IT/TR/ZH/JA/RU listed in selector but show "available in future updates" toast.
- Dashboard polish: premium badges, lock icons, small animations, keep existing white/blue/teal medical theme.

---

## Out of scope / deferred (need separate decisions)

- **Real Stripe payments** — per your earlier call, subscriptions remain simulated (tier is a column you can flip). I'll wire Stripe when you say go.
- **WebSockets / Firebase** — using Lovable Cloud Realtime (Supabase Realtime) instead. Same UX, already in stack.
- **Actual smartwatch / voice / heart-rate hardware** — locked UI only; no native integration.
- **Capacitor push notifications** — using browser Notification API in-app; native push needs APK rebuild + FCM setup.
- **SMS to caregivers** — caregivers get in-app realtime + browser notification. Real SMS needs Twilio (paid secret).

## Technical notes

- Stack: TanStack Start + Lovable Cloud (Supabase). All server reads go through `createServerFn` where needed; client realtime via `supabase.channel(...)`.
- New packages: `qrcode` (QR render), `html5-qrcode` (scanner). Both pure JS, Worker-safe.
- New routes: `/onboarding`, `/medical-profile`, `/link`, `/alerts`, `/coming-soon`.
- Phases 1–2 are ~1 large turn each; Phase 3–4 ~1 turn each. Total ~4 turns.

---

**Reply "go" to start Phase 1 (migration + roles), or tell me which phase / cuts to change.**