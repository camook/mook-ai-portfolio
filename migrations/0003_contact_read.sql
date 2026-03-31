-- ─────────────────────────────────────────────
-- Add read flag to contact_submissions
-- ─────────────────────────────────────────────
ALTER TABLE contact_submissions ADD COLUMN read INTEGER NOT NULL DEFAULT 0;
