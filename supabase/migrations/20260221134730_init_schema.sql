-- Nash Domik pair isolation schema

CREATE TABLE IF NOT EXISTS public.pair (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) NOT NULL,
  user2_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pair_unique UNIQUE (user1_id, user2_id)
);
ALTER TABLE public.pair ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own pair" ON public.pair FOR ALL
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  attachment_url TEXT,
  text TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for signals" ON public.signals FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = signals.sender_id OR pair.user2_id = signals.sender_id)));

CREATE TABLE IF NOT EXISTS public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for moments" ON public.moments FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = moments.sender_id OR pair.user2_id = moments.sender_id)));

CREATE TABLE IF NOT EXISTS public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read templates" ON public.replies FOR SELECT USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id TEXT NOT NULL,
  text TEXT NOT NULL
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read questions" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  note TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for wishlist" ON public.wishlist_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = wishlist_items.user_id OR pair.user2_id = wishlist_items.user_id)));

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for plans" ON public.plans FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = plans.creator_id OR pair.user2_id = plans.creator_id)));

CREATE TABLE IF NOT EXISTS public.memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for memories" ON public.memory_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = memory_items.user_id OR pair.user2_id = memory_items.user_id)));
