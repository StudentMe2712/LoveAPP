-- Add new columns for the rich Plans feature
ALTER TABLE public.plans
  DROP COLUMN IF EXISTS date,
  ADD COLUMN description TEXT,
  ADD COLUMN suggested_slots JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN chosen_slot TEXT,
  ADD COLUMN status TEXT DEFAULT 'proposed';
