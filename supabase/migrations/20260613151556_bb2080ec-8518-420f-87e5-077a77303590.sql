
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS allergies_drug text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies_food text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medical_notes text;

CREATE TABLE IF NOT EXISTS public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  dose text,
  frequency text,
  reminder_time time,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own meds" ON public.medications
  FOR ALL TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Linked caregivers read meds" ON public.medications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.caregiver_patient_links l
    WHERE l.patient_id = medications.patient_id AND l.caregiver_id = auth.uid()
  ));

CREATE TRIGGER trg_meds_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taken_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'taken' CHECK (status IN ('taken','missed','snoozed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own med logs" ON public.medication_logs
  FOR ALL TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Linked caregivers read med logs" ON public.medication_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.caregiver_patient_links l
    WHERE l.patient_id = medication_logs.patient_id AND l.caregiver_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medlogs_patient_time ON public.medication_logs(patient_id, taken_at DESC);
