-- Create Wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  price TEXT,
  tags TEXT[], -- array of tags
  is_hint BOOLEAN DEFAULT false, -- if true, it's a subtle hint
  status TEXT DEFAULT 'wanted', -- 'wanted', 'reserved', 'gifted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pair isolation for wishlist" ON public.wishlist FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = wishlist.user_id OR pair.user2_id = wishlist.user_id)));
