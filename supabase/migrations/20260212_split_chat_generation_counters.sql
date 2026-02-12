-- Fixpack 2: Split shared message_count into separate chat and generation counters.
--
-- Previously both chat-with-olivia and generate-instant-outfits incremented
-- the same message_count column, so using one feature consumed the other's
-- daily credits.  The new columns give each feature its own counter and
-- its own daily-reset timestamp.
--
-- The old message_count / last_message_at columns are kept for backward
-- compatibility (other code may still reference them) but are no longer
-- the source of truth for rate limiting.

ALTER TABLE user_chat_limits
  ADD COLUMN IF NOT EXISTS chat_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_chat_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_generation_at timestamp with time zone;

-- Seed new columns from existing data.  We cannot distinguish historical
-- chat vs generation usage, so we copy everything into chat_count (the
-- more conservative choice — chat has the lower 5/day limit).
UPDATE user_chat_limits
SET chat_count      = message_count,
    last_chat_at    = last_message_at
WHERE message_count > 0;
