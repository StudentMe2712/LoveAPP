-- Add scheduled_at column to surprises table for time-delayed messages
ALTER TABLE surprises ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL;

-- Index for efficient querying of scheduled messages
CREATE INDEX IF NOT EXISTS idx_surprises_scheduled_at ON surprises(scheduled_at) WHERE scheduled_at IS NOT NULL;
