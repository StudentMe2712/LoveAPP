-- Chat messages for pair-only realtime chat, with media support.
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_kind TEXT NOT NULL DEFAULT 'text',
  body_text TEXT,
  media_url TEXT,
  media_mime TEXT,
  media_size_bytes INTEGER,
  media_duration_sec NUMERIC(7,2),
  media_width INTEGER,
  media_height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_kind TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime TEXT,
  ADD COLUMN IF NOT EXISTS media_size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS media_duration_sec NUMERIC(7,2),
  ADD COLUMN IF NOT EXISTS media_width INTEGER,
  ADD COLUMN IF NOT EXISTS media_height INTEGER;

ALTER TABLE public.chat_messages
  ALTER COLUMN body_text DROP NOT NULL;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_sender_receiver_check,
  DROP CONSTRAINT IF EXISTS chat_body_length_check,
  DROP CONSTRAINT IF EXISTS chat_message_kind_check,
  DROP CONSTRAINT IF EXISTS chat_payload_validity_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_sender_receiver_check CHECK (sender_id <> receiver_id),
  ADD CONSTRAINT chat_body_length_check CHECK (
    body_text IS NULL OR char_length(trim(body_text)) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT chat_message_kind_check CHECK (
    message_kind IN ('text', 'image', 'voice', 'video_note')
  ),
  ADD CONSTRAINT chat_payload_validity_check CHECK (
    (message_kind = 'text' AND body_text IS NOT NULL AND media_url IS NULL)
    OR (message_kind IN ('image', 'voice', 'video_note') AND media_url IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_chat_messages_pair_created
  ON public.chat_messages(pair_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_read
  ON public.chat_messages(receiver_id, read_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read pair chat messages" ON public.chat_messages;
CREATE POLICY "Users can read pair chat messages"
ON public.chat_messages
FOR SELECT
USING (
  pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send pair chat messages" ON public.chat_messages;
CREATE POLICY "Users can send pair chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND pair_id IN (
    SELECT p.id
    FROM public.pair p
    WHERE p.id = chat_messages.pair_id
      AND (p.user1_id = auth.uid() OR p.user2_id = auth.uid())
      AND (chat_messages.receiver_id = p.user1_id OR chat_messages.receiver_id = p.user2_id)
      AND chat_messages.receiver_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "Receiver can mark messages as read" ON public.chat_messages;
CREATE POLICY "Receiver can mark messages as read"
ON public.chat_messages
FOR UPDATE
USING (
  receiver_id = auth.uid()
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
)
WITH CHECK (
  receiver_id = auth.uid()
  AND read_at IS NOT NULL
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.enforce_chat_read_only_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id <> OLD.id
    OR NEW.pair_id <> OLD.pair_id
    OR NEW.sender_id <> OLD.sender_id
    OR NEW.receiver_id <> OLD.receiver_id
    OR NEW.message_kind <> OLD.message_kind
    OR COALESCE(NEW.body_text, '') <> COALESCE(OLD.body_text, '')
    OR COALESCE(NEW.media_url, '') <> COALESCE(OLD.media_url, '')
    OR COALESCE(NEW.media_mime, '') <> COALESCE(OLD.media_mime, '')
    OR COALESCE(NEW.media_size_bytes, -1) <> COALESCE(OLD.media_size_bytes, -1)
    OR COALESCE(NEW.media_duration_sec, -1) <> COALESCE(OLD.media_duration_sec, -1)
    OR COALESCE(NEW.media_width, -1) <> COALESCE(OLD.media_width, -1)
    OR COALESCE(NEW.media_height, -1) <> COALESCE(OLD.media_height, -1)
    OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at can be updated';
  END IF;

  IF NEW.read_at IS NULL THEN
    RAISE EXCEPTION 'read_at must not be null when updating chat_messages';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_read_only_update ON public.chat_messages;
CREATE TRIGGER trg_chat_read_only_update
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chat_read_only_update();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
