ALTER TABLE trips ADD COLUMN additional_trips_json TEXT NOT NULL DEFAULT '[]';

UPDATE trips SET
  additional_trips_json = sub_trips_json,
  sub_trips_json = '[]',
  route_distance_meters = NULL,
  delivery_distance_meters = NULL,
  route_duration_seconds = NULL,
  route_waypoints_json = '[]',
  route_geometry_json = '[]',
  route_calculated_at = '';
