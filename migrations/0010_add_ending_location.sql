ALTER TABLE trips ADD COLUMN ending_province_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_province TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_city_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_city TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_barangay_code TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_barangay TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN ending_address TEXT NOT NULL DEFAULT '';

-- Preserve the previous Home -> ... -> Home behavior for existing records.
UPDATE trips SET
  ending_province_code = home_province_code,
  ending_province = home_province,
  ending_city_code = home_city_code,
  ending_city = home_city,
  ending_barangay_code = home_barangay_code,
  ending_barangay = home_barangay,
  ending_address = home_address;
