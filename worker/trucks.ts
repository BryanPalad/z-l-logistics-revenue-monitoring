export interface TruckInput {
  brand: string
  truckType: string
  plateNumber: string
  color: string
  fuelEfficiencyKmPerLiter: number
}

export interface TruckRow {
  id: string
  brand: string
  truck_type: string
  plate_number: string
  color: string
  fuel_efficiency_km_per_liter: number
  created_at: string
  updated_at: string
}

export const validateTruck = (value: unknown): TruckInput => {
  if (!value || typeof value !== 'object') throw new Error('Invalid truck data.')
  const input = value as Record<string, unknown>
  const brand = String(input.brand ?? '').trim()
  const truckType = String(input.truckType ?? '').trim()
  const plateNumber = String(input.plateNumber ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
  const color = String(input.color ?? '').trim()
  const fuelEfficiencyKmPerLiter = Number(input.fuelEfficiencyKmPerLiter)
  if (!brand) throw new Error('Truck manufacturer or brand is required.')
  if (brand.length > 60) throw new Error('Truck manufacturer or brand must be 60 characters or fewer.')
  if (!truckType) throw new Error('Truck type is required.')
  if (truckType.length > 60) throw new Error('Truck type must be 60 characters or fewer.')
  if (!plateNumber) throw new Error('Plate number is required.')
  if (plateNumber.length > 20) throw new Error('Plate number must be 20 characters or fewer.')
  if (!color) throw new Error('Truck color is required.')
  if (color.length > 40) throw new Error('Truck color must be 40 characters or fewer.')
  if (!Number.isFinite(fuelEfficiencyKmPerLiter) || fuelEfficiencyKmPerLiter <= 0 || fuelEfficiencyKmPerLiter > 100) {
    throw new Error('Fuel efficiency must be greater than 0 and no more than 100 km/L.')
  }
  return { brand, truckType, plateNumber, color, fuelEfficiencyKmPerLiter }
}

export const rowToTruck = (row: TruckRow) => ({
  id: row.id,
  brand: row.brand,
  truckType: row.truck_type,
  plateNumber: row.plate_number,
  color: row.color,
  fuelEfficiencyKmPerLiter: Number(row.fuel_efficiency_km_per_liter),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
