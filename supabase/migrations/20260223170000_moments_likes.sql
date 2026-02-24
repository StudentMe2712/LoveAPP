-- Add likes and favorites to moments
ALTER TABLE public.moments
    ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN DEFAULT FALSE;

-- Allow both pair members to update moments (for likes/favorites/captions)
CREATE POLICY "Pair members can update moments" ON public.moments FOR UPDATE
USING (
    sender_id IN (
        SELECT user1_id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
        UNION
        SELECT user2_id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);
