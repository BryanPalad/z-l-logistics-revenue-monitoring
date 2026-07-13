ALTER TABLE trips ADD COLUMN origin_barangay_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN origin_barangay TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_barangay_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_barangay TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_trips_origin_barangay ON trips (origin_barangay_code);
CREATE INDEX IF NOT EXISTS idx_trips_destination_barangay ON trips (destination_barangay_code);
