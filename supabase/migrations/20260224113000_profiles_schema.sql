-- Profiles table for public partner names/avatars used by UI
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read pair profiles" ON public.profiles;
CREATE POLICY "Users can read pair profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.pair p
    WHERE (p.user1_id = auth.uid() OR p.user2_id = auth.uid())
      AND (p.user1_id = profiles.id OR p.user2_id = profiles.id)
  )
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Backfill profiles from existing auth users metadata
INSERT INTO public.profiles (id, display_name, avatar_url, updated_at)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data ->> 'display_name', ''),
  NULLIF(u.raw_user_meta_data ->> 'avatar_url', ''),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  updated_at = NOW();

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_profile_sync ON auth.users;
CREATE TRIGGER on_auth_user_profile_sync
AFTER INSERT OR UPDATE OF raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_from_auth_users();
