-- Fixpack 4: Soft-delete for outfits and clothing_items.
--
-- Instead of hard-deleting rows (which orphans outfit_logs, calendar_events,
-- and feedback that reference the outfit/item by ID), we set deleted_at.
-- All list queries filter with "deleted_at IS NULL".

ALTER TABLE outfits
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE clothing_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
