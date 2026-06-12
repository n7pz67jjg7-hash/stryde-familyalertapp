
-- =========================
-- ROLES
-- =========================
CREATE TYPE public.app_role AS ENUM ('patient', 'caregiver');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================
-- PROFILES EXTENSION
-- =========================
ALTER TABLE public.profiles
  ADD COLUMN role public.app_role NOT NULL DEFAULT 'patient',
  ADD COLUMN age int,
  ADD COLUMN gender text,
  ADD COLUMN blood_type text,
  ADD COLUMN weight_kg numeric,
  ADD COLUMN height_cm numeric,
  ADD COLUMN emergency_contact_name text,
  ADD COLUMN emergency_contact_phone text,
  ADD COLUMN medical_conditions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN medications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN language text NOT NULL DEFAULT 'en',
  ADD COLUMN onboarded_at timestamptz,
  ADD COLUMN patient_code text UNIQUE;

-- Helper: generate a short unique patient code (8 chars, no ambiguous letters)
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_already boolean;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE patient_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

-- Updated new-user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'patient')::public.app_role;
  v_code text := NULL;
BEGIN
  IF v_role = 'patient' THEN
    v_code := public.generate_patient_code();
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, patient_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    v_role,
    v_code
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing profiles
UPDATE public.profiles SET patient_code = public.generate_patient_code()
WHERE patient_code IS NULL AND role = 'patient';

INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- =========================
-- CAREGIVER ↔ PATIENT LINKS
-- =========================
CREATE TABLE public.caregiver_patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(caregiver_id, patient_id)
);

GRANT SELECT, INSERT, DELETE ON public.caregiver_patient_links TO authenticated;
GRANT ALL ON public.caregiver_patient_links TO service_role;

ALTER TABLE public.caregiver_patient_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers and patients view their links"
  ON public.caregiver_patient_links
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id OR auth.uid() = patient_id);

CREATE POLICY "Caregivers create links for themselves"
  ON public.caregiver_patient_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caregiver_id AND public.has_role(auth.uid(), 'caregiver'));

CREATE POLICY "Caregivers or patients remove links"
  ON public.caregiver_patient_links
  FOR DELETE TO authenticated
  USING (auth.uid() = caregiver_id OR auth.uid() = patient_id);

-- =========================
-- EMERGENCY EVENTS
-- =========================
CREATE TABLE public.emergency_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  lat double precision,
  lng double precision,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE ON public.emergency_events TO authenticated;
GRANT ALL ON public.emergency_events TO service_role;

ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient and linked caregivers view events"
  ON public.emergency_events
  FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM public.caregiver_patient_links l
      WHERE l.patient_id = emergency_events.patient_id
        AND l.caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patient inserts own events"
  ON public.emergency_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patient or linked caregivers resolve events"
  ON public.emergency_events
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM public.caregiver_patient_links l
      WHERE l.patient_id = emergency_events.patient_id
        AND l.caregiver_id = auth.uid()
    )
  );

CREATE INDEX idx_emergency_events_patient ON public.emergency_events(patient_id, triggered_at DESC);
CREATE INDEX idx_links_caregiver ON public.caregiver_patient_links(caregiver_id);
CREATE INDEX idx_links_patient ON public.caregiver_patient_links(patient_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.caregiver_patient_links;
