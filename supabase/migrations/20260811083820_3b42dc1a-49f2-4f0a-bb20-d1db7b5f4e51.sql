
-- HOSPITAL REVIEWS
CREATE TABLE public.hospital_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  place_name text NOT NULL DEFAULT '',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_reviews TO authenticated;
GRANT SELECT ON public.hospital_reviews TO anon;
GRANT ALL ON public.hospital_reviews TO service_role;
ALTER TABLE public.hospital_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hospital reviews" ON public.hospital_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own hospital reviews" ON public.hospital_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own hospital reviews" ON public.hospital_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own hospital reviews" ON public.hospital_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_hospital_reviews_updated_at BEFORE UPDATE ON public.hospital_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_hospital_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_hospital_review BEFORE INSERT OR UPDATE ON public.hospital_reviews FOR EACH ROW EXECUTE FUNCTION public.validate_hospital_review();

-- HOSPITAL FAVORITES
CREATE TABLE public.hospital_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  place_name text NOT NULL DEFAULT '',
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_favorites TO authenticated;
GRANT ALL ON public.hospital_favorites TO service_role;
ALTER TABLE public.hospital_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hospital favorites" ON public.hospital_favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  specialty text,
  hospital_name text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own appointments" ON public.appointments FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Linked caregivers read appointments" ON public.appointments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = appointments.patient_id AND l.caregiver_id = auth.uid()));
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VITALS
CREATE TABLE public.vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  value numeric NOT NULL,
  value2 numeric,
  unit text,
  note text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT ALL ON public.vitals TO service_role;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own vitals" ON public.vitals FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Linked caregivers read vitals" ON public.vitals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = vitals.patient_id AND l.caregiver_id = auth.uid()));

-- LAB RESULTS
CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  result text NOT NULL,
  unit text,
  reference_range text,
  lab_name text,
  taken_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own lab results" ON public.lab_results FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Linked caregivers read lab results" ON public.lab_results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = lab_results.patient_id AND l.caregiver_id = auth.uid()));

-- SAFE ZONES
CREATE TABLE public.safe_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_m integer NOT NULL DEFAULT 200,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safe_zones TO authenticated;
GRANT ALL ON public.safe_zones TO service_role;
ALTER TABLE public.safe_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own safe zones" ON public.safe_zones FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Linked caregivers read safe zones" ON public.safe_zones FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = safe_zones.patient_id AND l.caregiver_id = auth.uid()));
CREATE TRIGGER trg_safe_zones_updated_at BEFORE UPDATE ON public.safe_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CARE MESSAGES
CREATE TABLE public.care_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_messages TO authenticated;
GRANT ALL ON public.care_messages TO service_role;
ALTER TABLE public.care_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read care messages" ON public.care_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Linked users send care messages" ON public.care_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.caregiver_patient_links l
    WHERE (l.caregiver_id = auth.uid() AND l.patient_id = recipient_id)
       OR (l.patient_id = auth.uid() AND l.caregiver_id = recipient_id)
  )
);
CREATE POLICY "Recipients mark care messages read" ON public.care_messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "Senders delete own care messages" ON public.care_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- CHECK-INS
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ok',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own check ins" ON public.check_ins FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Linked caregivers read check ins" ON public.check_ins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = check_ins.patient_id AND l.caregiver_id = auth.uid()));

-- INCIDENT REPORTS
CREATE TABLE public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.emergency_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_reports TO authenticated;
GRANT ALL ON public.incident_reports TO service_role;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient and linked caregivers read incidents" ON public.incident_reports FOR SELECT TO authenticated USING (
  auth.uid() = patient_id OR EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = incident_reports.patient_id AND l.caregiver_id = auth.uid())
);
CREATE POLICY "Patient and linked caregivers create incidents" ON public.incident_reports FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND (
    auth.uid() = patient_id OR EXISTS (SELECT 1 FROM public.caregiver_patient_links l WHERE l.patient_id = incident_reports.patient_id AND l.caregiver_id = auth.uid())
  )
);
CREATE POLICY "Authors update own incidents" ON public.incident_reports FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authors delete own incidents" ON public.incident_reports FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_egp numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices" ON public.invoices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tickets" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
