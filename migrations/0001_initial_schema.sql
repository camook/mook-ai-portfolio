-- Migration: 0001_initial_schema
-- Creates all tables for the portfolio site

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
CREATE TABLE projects (
  id               TEXT    NOT NULL PRIMARY KEY,  -- ULID
  title            TEXT    NOT NULL,
  slug             TEXT    NOT NULL UNIQUE,
  category_tags    TEXT    NOT NULL DEFAULT '[]', -- JSON array, e.g. ["NLP","TRANSFORMERS"]
  description      TEXT    NOT NULL,              -- short summary
  long_description TEXT    NOT NULL DEFAULT '',   -- Markdown
  tech_stack       TEXT    NOT NULL DEFAULT '[]', -- JSON array of tech names
  github_url       TEXT    NOT NULL,
  live_url         TEXT,                          -- nullable
  thumbnail_key    TEXT    NOT NULL,              -- R2 object key
  key_metric_label TEXT,                          -- nullable, e.g. "Accuracy"
  key_metric_value TEXT,                          -- nullable, e.g. "99.9"
  card_size        TEXT    NOT NULL DEFAULT 'medium'
                           CHECK (card_size IN ('large', 'medium', 'small')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('published', 'draft')),
  featured         INTEGER NOT NULL DEFAULT 0     -- 1 = show in featured section
                           CHECK (featured IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_projects_slug     ON projects (slug);
CREATE INDEX idx_projects_status   ON projects (status);
CREATE INDEX idx_projects_featured ON projects (featured) WHERE featured = 1;
CREATE INDEX idx_projects_order    ON projects (sort_order);

-- ─────────────────────────────────────────────
-- project_images
-- ─────────────────────────────────────────────
CREATE TABLE project_images (
  id         TEXT    NOT NULL PRIMARY KEY,  -- ULID
  project_id TEXT    NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  r2_key     TEXT    NOT NULL,
  alt_text   TEXT    NOT NULL DEFAULT '',
  caption    TEXT,                          -- nullable
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_project_images_project ON project_images (project_id, sort_order);

-- ─────────────────────────────────────────────
-- experience
-- ─────────────────────────────────────────────
CREATE TABLE experience (
  id                TEXT    NOT NULL PRIMARY KEY,  -- ULID
  year              INTEGER NOT NULL,
  year_label        TEXT,                          -- nullable, e.g. "CURRENT"
  role_title        TEXT    NOT NULL,
  company           TEXT    NOT NULL,
  description       TEXT    NOT NULL DEFAULT '',
  achievement_label TEXT,                          -- nullable, e.g. "HIGHLIGHT"
  achievement_text  TEXT,                          -- nullable
  sort_order        INTEGER NOT NULL DEFAULT 0,    -- lower = shown first (newest)
  status            TEXT    NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('published', 'draft')),
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_experience_status ON experience (status);
CREATE INDEX idx_experience_order  ON experience (sort_order);

-- ─────────────────────────────────────────────
-- tech_stack
-- ─────────────────────────────────────────────
CREATE TABLE tech_stack (
  id         TEXT    NOT NULL PRIMARY KEY,  -- ULID
  name       TEXT    NOT NULL,
  category   TEXT    NOT NULL
             CHECK (category IN ('pill', 'runtime', 'infrastructure')),
  percentage INTEGER                        -- nullable; only meaningful for 'runtime'
             CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
  qualifier  TEXT,                          -- nullable, e.g. "PRD"
  sort_order INTEGER NOT NULL DEFAULT 0,
  status     TEXT    NOT NULL DEFAULT 'draft'
             CHECK (status IN ('published', 'draft'))
);

CREATE INDEX idx_tech_stack_category ON tech_stack (category, sort_order);
CREATE INDEX idx_tech_stack_status   ON tech_stack (status);

-- ─────────────────────────────────────────────
-- site_content  (key/value CMS)
-- ─────────────────────────────────────────────
CREATE TABLE site_content (
  key        TEXT NOT NULL PRIMARY KEY,  -- e.g. "hero_headline"
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ─────────────────────────────────────────────
-- stats
-- ─────────────────────────────────────────────
CREATE TABLE stats (
  id         TEXT    NOT NULL PRIMARY KEY,  -- ULID
  section    TEXT    NOT NULL
             CHECK (section IN ('tech_stack', 'hero')),
  label      TEXT    NOT NULL,              -- e.g. "Reference Rate"
  value      TEXT    NOT NULL,              -- e.g. "12k"
  unit       TEXT    NOT NULL DEFAULT '',   -- e.g. "req/s"
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_stats_section ON stats (section, sort_order);
