-- Add photo_url to wishlist items
ALTER TABLE public.wishlist
    ADD COLUMN IF NOT EXISTS photo_url TEXT;
