-- Presence table for heartbeat-based online indicator in chat.
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_pair_last_seen
  ON public.user_presence(pair_id, last_seen_at DESC);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read pair presence" ON public.user_presence;
CREATE POLICY "Users can read pair presence"
ON public.user_presence
FOR SELECT
USING (
  pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can upsert own presence" ON public.user_presence;
CREATE POLICY "Users can upsert own presence"
ON public.user_presence
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence;
CREATE POLICY "Users can update own presence"
ON public.user_presence
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
