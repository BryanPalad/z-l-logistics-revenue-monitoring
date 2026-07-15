CREATE TABLE IF NOT EXISTS saved_trucks (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  truck_type TEXT NOT NULL,
  plate_number TEXT NOT NULL COLLATE NOCASE UNIQUE,
  color TEXT NOT NULL,
  fuel_efficiency_km_per_liter REAL NOT NULL CHECK (fuel_efficiency_km_per_liter > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_trucks_plate_number ON saved_trucks (plate_number COLLATE NOCASE);
