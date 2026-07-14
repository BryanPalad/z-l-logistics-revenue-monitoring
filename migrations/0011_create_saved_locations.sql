CREATE TABLE IF NOT EXISTS saved_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  province_code TEXT NOT NULL,
  province TEXT NOT NULL,
  city_code TEXT NOT NULL,
  city TEXT NOT NULL,
  barangay_code TEXT NOT NULL DEFAULT '',
  barangay TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_name ON saved_locations (name COLLATE NOCASE);
