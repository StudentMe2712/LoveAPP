-- Chat message actions: reply/edit/delete support.

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to
  ON public.chat_messages(reply_to_id);

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_payload_validity_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_payload_validity_check CHECK (
    deleted_at IS NOT NULL
    OR (message_kind = 'text' AND body_text IS NOT NULL AND media_url IS NULL)
    OR (message_kind IN ('image', 'voice', 'video_note') AND media_url IS NOT NULL)
  );

DROP POLICY IF EXISTS "Receiver can mark messages as read" ON public.chat_messages;
DROP POLICY IF EXISTS "Sender can edit or delete own messages" ON public.chat_messages;

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
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

CREATE POLICY "Sender can edit or delete own messages"
ON public.chat_messages
FOR UPDATE
USING (
  sender_id = auth.uid()
  AND pair_id IN (
    SELECT id
    FROM public.pair
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
)
WITH CHECK (
  sender_id = auth.uid()
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
    OR COALESCE(NEW.reply_to_id::text, '') <> COALESCE(OLD.reply_to_id::text, '')
    OR NEW.message_kind <> OLD.message_kind
    OR COALESCE(NEW.media_url, '') <> COALESCE(OLD.media_url, '')
    OR COALESCE(NEW.media_mime, '') <> COALESCE(OLD.media_mime, '')
    OR COALESCE(NEW.media_size_bytes, -1) <> COALESCE(OLD.media_size_bytes, -1)
    OR COALESCE(NEW.media_duration_sec, -1) <> COALESCE(OLD.media_duration_sec, -1)
    OR COALESCE(NEW.media_width, -1) <> COALESCE(OLD.media_width, -1)
    OR COALESCE(NEW.media_height, -1) <> COALESCE(OLD.media_height, -1)
    OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Immutable chat fields cannot be updated';
  END IF;

  -- Receiver: read receipt update only.
  IF auth.uid() = OLD.receiver_id THEN
    IF NEW.read_at IS NULL THEN
      RAISE EXCEPTION 'read_at must not be null';
    END IF;
    IF COALESCE(NEW.body_text, '') <> COALESCE(OLD.body_text, '')
      OR COALESCE(NEW.edited_at::text, '') <> COALESCE(OLD.edited_at::text, '')
      OR COALESCE(NEW.deleted_at::text, '') <> COALESCE(OLD.deleted_at::text, '') THEN
      RAISE EXCEPTION 'Receiver can update read_at only';
    END IF;
    RETURN NEW;
  END IF;

  -- Sender: edit/delete own message only.
  IF auth.uid() = OLD.sender_id THEN
    IF COALESCE(NEW.read_at::text, '') <> COALESCE(OLD.read_at::text, '') THEN
      RAISE EXCEPTION 'Sender cannot update read_at';
    END IF;

    IF OLD.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Deleted message cannot be changed';
    END IF;

    -- Delete branch: allow setting deleted_at and clearing body.
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      IF NEW.body_text IS NOT NULL THEN
        RAISE EXCEPTION 'Deleted message body must be null';
      END IF;
      RETURN NEW;
    END IF;

    -- Edit branch: text messages only.
    IF OLD.message_kind <> 'text' THEN
      RAISE EXCEPTION 'Only text messages can be edited';
    END IF;
    IF NEW.body_text IS NULL OR char_length(trim(NEW.body_text)) < 1 OR char_length(trim(NEW.body_text)) > 2000 THEN
      RAISE EXCEPTION 'Invalid edited text length';
    END IF;
    IF NEW.body_text = OLD.body_text THEN
      RAISE EXCEPTION 'Edited text is identical';
    END IF;
    IF NEW.edited_at IS NULL THEN
      RAISE EXCEPTION 'edited_at is required for edit';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Update not allowed';
END;
$$;
