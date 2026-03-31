-- ─────────────────────────────────────────────
-- contact_submissions
-- ─────────────────────────────────────────────
CREATE TABLE contact_submissions (
  id         TEXT NOT NULL PRIMARY KEY,  -- ULID
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_contact_created ON contact_submissions (created_at DESC);
