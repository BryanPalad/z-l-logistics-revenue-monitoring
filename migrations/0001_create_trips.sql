CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  trip_date TEXT NOT NULL,
  truck_plate_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  helper_name TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  revenue_centavos INTEGER NOT NULL CHECK (revenue_centavos >= 0),
  driver_rate_centavos INTEGER NOT NULL CHECK (driver_rate_centavos >= 0),
  helper_rate_centavos INTEGER NOT NULL DEFAULT 0 CHECK (helper_rate_centavos >= 0),
  gas_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (gas_expense_centavos >= 0),
  parking_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (parking_expense_centavos >= 0),
  toll_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (toll_expense_centavos >= 0),
  food_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (food_expense_centavos >= 0),
  other_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (other_expense_centavos >= 0),
  remarks TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_date ON trips (trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips (driver_name);
CREATE INDEX IF NOT EXISTS idx_trips_plate ON trips (truck_plate_number);
