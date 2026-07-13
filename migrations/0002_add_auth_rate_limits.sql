CREATE TABLE IF NOT EXISTS auth_attempts (
  client_key TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
