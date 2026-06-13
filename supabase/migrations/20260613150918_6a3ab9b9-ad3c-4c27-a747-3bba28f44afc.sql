
-- 1) Remove unrestricted caregiver self-link INSERT; force linking via RPC that validates patient_code
DROP POLICY IF EXISTS "Caregivers create links for themselves" ON public.caregiver_patient_links;

CREATE OR REPLACE FUNCTION public.link_caregiver_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_link_id uuid;
  v_clean text := upper(regexp_replace(coalesce(_code,''), '^STRYDE:', ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(auth.uid(), 'caregiver') THEN
    RAISE EXCEPTION 'Only caregivers can link to a patient';
  END IF;
  IF length(v_clean) <> 8 THEN
    RAISE EXCEPTION 'Invalid patient code';
  END IF;

  SELECT id INTO v_patient_id
  FROM public.profiles
  WHERE patient_code = v_clean AND role = 'patient';

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient code not found';
  END IF;
  IF v_patient_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot link to self';
  END IF;

  INSERT INTO public.caregiver_patient_links (caregiver_id, patient_id)
  VALUES (auth.uid(), v_patient_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    SELECT id INTO v_link_id FROM public.caregiver_patient_links
    WHERE caregiver_id = auth.uid() AND patient_id = v_patient_id;
  END IF;

  RETURN v_link_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_caregiver_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_caregiver_by_code(text) TO authenticated;

-- Ensure unique link
CREATE UNIQUE INDEX IF NOT EXISTS caregiver_patient_links_unique
  ON public.caregiver_patient_links (caregiver_id, patient_id);

-- 2) Allow linked caregivers to read their patients' profiles (sanctioned RLS path)
DROP POLICY IF EXISTS "Linked caregivers view patient profile" ON public.profiles;
CREATE POLICY "Linked caregivers view patient profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.caregiver_patient_links l
    WHERE l.patient_id = profiles.id AND l.caregiver_id = auth.uid()
  )
);

-- 3) Lock down Realtime broadcast/presence channels (we only use postgres_changes,
--    which is governed by table RLS). Default-deny on realtime.messages.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "stryde_deny_all_realtime_messages" ON realtime.messages';
    EXECUTE 'CREATE POLICY "stryde_deny_all_realtime_messages" ON realtime.messages FOR ALL TO authenticated, anon USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- 4) Reduce exposure of internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.generate_patient_code() FROM PUBLIC, anon, authenticated;
