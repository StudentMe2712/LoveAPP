---
-- Table for Tic-Tac-Toe Scores
---

CREATE TABLE IF NOT EXISTS public.tictactoe_scores (
    pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user1_score INTEGER NOT NULL DEFAULT 0,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_score INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (pair_id)
);

ALTER TABLE public.tictactoe_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for pair users" ON public.tictactoe_scores
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Enable update for pair users" ON public.tictactoe_scores
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Enable insert for pair users" ON public.tictactoe_scores
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
