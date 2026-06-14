
ALTER TABLE public.emergency_events
  ADD COLUMN IF NOT EXISTS resolution_code text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS risk_score integer;

-- Generate a short 4-char resolution code on insert when missing
CREATE OR REPLACE FUNCTION public.set_emergency_resolution_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  IF NEW.resolution_code IS NULL OR length(NEW.resolution_code) <> 4 THEN
    code := '';
    FOR i IN 1..4 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    NEW.resolution_code := code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_emergency_resolution_code ON public.emergency_events;
CREATE TRIGGER trg_set_emergency_resolution_code
BEFORE INSERT ON public.emergency_events
FOR EACH ROW EXECUTE FUNCTION public.set_emergency_resolution_code();
