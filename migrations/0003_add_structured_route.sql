ALTER TABLE trips ADD COLUMN origin_province_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN origin_province TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN origin_city_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN origin_city TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN origin_address TEXT NOT NULL DEFAULT '';

ALTER TABLE trips ADD COLUMN destination_province_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_province TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_city_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_city TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN destination_address TEXT NOT NULL DEFAULT '';

UPDATE trips SET destination_address = destination WHERE destination_address = '';

CREATE INDEX IF NOT EXISTS idx_trips_origin_city ON trips (origin_city_code);
CREATE INDEX IF NOT EXISTS idx_trips_destination_city ON trips (destination_city_code);
