CREATE TABLE IF NOT EXISTS fuel_logs (
  id TEXT PRIMARY KEY,
  truck_id TEXT REFERENCES saved_trucks(id) ON DELETE SET NULL,
  truck_plate_number TEXT NOT NULL COLLATE NOCASE,
  purchase_date TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos > 0),
  liters REAL NOT NULL CHECK (liters > 0),
  odometer_km REAL CHECK (odometer_km IS NULL OR odometer_km >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_purchase_date ON fuel_logs (purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_truck_id ON fuel_logs (truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_plate_number ON fuel_logs (truck_plate_number COLLATE NOCASE);
