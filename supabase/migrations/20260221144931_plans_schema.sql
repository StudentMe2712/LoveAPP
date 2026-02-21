-- Add new columns for the rich Plans feature
ALTER TABLE public.plans
  DROP COLUMN IF EXISTS date,
  ADD COLUMN IF EXISTS description TEXT,
  ADD COLUMN IF EXISTS suggested_slots JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF EXISTS chosen_slot TEXT,
  ADD COLUMN IF EXISTS status TEXT DEFAULT 'proposed';
