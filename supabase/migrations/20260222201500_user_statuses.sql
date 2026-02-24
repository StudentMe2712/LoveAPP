-- Migration to create user_statuses table
CREATE TABLE user_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
    status_text TEXT NOT NULL,
    status_emoji TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by pair
CREATE INDEX idx_user_statuses_pair_id ON user_statuses(pair_id);
CREATE UNIQUE INDEX idx_user_statuses_user_id ON user_statuses(user_id);

-- Enable RLS
ALTER TABLE user_statuses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view statuses of their pair" 
ON user_statuses FOR SELECT 
USING (
    pair_id IN (
        SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own status" 
ON user_statuses FOR INSERT 
WITH CHECK (
    user_id = auth.uid() AND
    pair_id IN (
        SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own status" 
ON user_statuses FOR UPDATE 
USING (user_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_statuses;
