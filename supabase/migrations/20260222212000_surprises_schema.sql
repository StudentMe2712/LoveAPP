CREATE TABLE public.surprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
  content_text TEXT,
  content_image TEXT,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surprises_pair_id ON public.surprises(pair_id);

ALTER TABLE public.surprises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see pair surprises" ON public.surprises FOR SELECT
USING (
  pair_id IN (
    SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own surprises" ON public.surprises FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  pair_id IN (
    SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Users can update pair surprises" ON public.surprises FOR UPDATE
USING (
  pair_id IN (
    SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);
