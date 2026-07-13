ALTER TABLE trips ADD COLUMN route_distance_meters INTEGER;
ALTER TABLE trips ADD COLUMN route_duration_seconds INTEGER;
ALTER TABLE trips ADD COLUMN route_waypoints_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE trips ADD COLUMN route_geometry_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE trips ADD COLUMN route_calculated_at TEXT NOT NULL DEFAULT '';
