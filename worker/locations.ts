export interface SavedLocationInput {
  name: string
  provinceCode: string
  province: string
  cityCode: string
  city: string
  barangayCode: string
  barangay: string
  address: string
}

export interface SavedLocationRow {
  id: string
  name: string
  province_code: string
  province: string
  city_code: string
  city: string
  barangay_code: string
  barangay: string
  address: string
  created_at: string
  updated_at: string
}

export const validateSavedLocation = (value: unknown): SavedLocationInput => {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved location data.')
  const input = value as Record<string, unknown>
  const location = {
    name: String(input.name ?? '').trim(),
    provinceCode: String(input.provinceCode ?? '').trim(),
    province: String(input.province ?? '').trim(),
    cityCode: String(input.cityCode ?? '').trim(),
    city: String(input.city ?? '').trim(),
    barangayCode: String(input.barangayCode ?? '').trim(),
    barangay: String(input.barangay ?? '').trim(),
    address: String(input.address ?? '').trim(),
  }
  if (!location.name) throw new Error('Location name is required.')
  if (location.name.length > 80) throw new Error('Location name must be 80 characters or fewer.')
  if (!location.province || !location.city) throw new Error('Province and city are required.')
  if (location.address.length > 250) throw new Error('Exact address must be 250 characters or fewer.')
  return location
}

export const rowToSavedLocation = (row: SavedLocationRow) => ({
  id: row.id,
  name: row.name,
  provinceCode: row.province_code,
  province: row.province,
  cityCode: row.city_code,
  city: row.city,
  barangayCode: row.barangay_code,
  barangay: row.barangay,
  address: row.address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
