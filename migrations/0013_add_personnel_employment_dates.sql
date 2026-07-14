ALTER TABLE saved_personnel ADD COLUMN start_date TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_personnel ADD COLUMN end_date TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_personnel ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1));
