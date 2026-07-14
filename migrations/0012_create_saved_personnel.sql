CREATE TABLE IF NOT EXISTS saved_personnel (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('driver', 'helper')),
  name TEXT NOT NULL COLLATE NOCASE,
  default_rate_centavos INTEGER NOT NULL DEFAULT 0 CHECK (default_rate_centavos >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (role, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_personnel_role_name ON saved_personnel (role, name COLLATE NOCASE);
