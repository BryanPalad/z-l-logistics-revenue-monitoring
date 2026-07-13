ALTER TABLE trips ADD COLUMN home_province_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_province TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_city_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_city TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_barangay_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_barangay TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN home_address TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN delivery_distance_meters INTEGER;

UPDATE trips SET
  route_distance_meters = NULL,
  route_duration_seconds = NULL,
  delivery_distance_meters = NULL,
  route_waypoints_json = '[]',
  route_geometry_json = '[]',
  route_calculated_at = '';

CREATE INDEX IF NOT EXISTS idx_trips_home_city ON trips (home_city_code);
