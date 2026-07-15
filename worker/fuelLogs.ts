export interface FuelLogInput {
  truckId: string
  purchaseDate: string
  amount: number
  liters: number
  odometerKm: number | null
  notes: string
}

export interface FuelLogRow {
  id: string
  truck_id: string | null
  truck_plate_number: string
  purchase_date: string
  amount_centavos: number
  liters: number
  odometer_km: number | null
  notes: string
  created_at: string
  updated_at: string
}

const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
  && new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date

export const validateFuelLog = (value: unknown): FuelLogInput => {
  if (!value || typeof value !== 'object') throw new Error('Invalid fuel purchase data.')
  const input = value as Record<string, unknown>
  const truckId = String(input.truckId ?? '').trim()
  const purchaseDate = String(input.purchaseDate ?? '').trim()
  const amount = Number(input.amount)
  const liters = Number(input.liters)
  const rawOdometer = input.odometerKm
  const odometerKm = rawOdometer === null || rawOdometer === undefined || rawOdometer === '' ? null : Number(rawOdometer)
  const notes = String(input.notes ?? '').trim()
  if (!truckId) throw new Error('Select a truck for this fuel purchase.')
  if (!validDate(purchaseDate)) throw new Error('Enter a valid fuel purchase date.')
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) throw new Error('Fuel amount must be greater than zero.')
  if (!Number.isFinite(liters) || liters <= 0 || liters > 10_000) throw new Error('Fuel liters must be greater than zero.')
  if (odometerKm !== null && (!Number.isFinite(odometerKm) || odometerKm < 0 || odometerKm > 10_000_000)) throw new Error('Odometer reading must be zero or greater.')
  if (notes.length > 250) throw new Error('Fuel notes must be 250 characters or fewer.')
  return { truckId, purchaseDate, amount, liters, odometerKm, notes }
}

export const rowToFuelLog = (row: FuelLogRow) => ({
  id: row.id,
  truckId: row.truck_id ?? '',
  truckPlateNumber: row.truck_plate_number,
  purchaseDate: row.purchase_date,
  amount: row.amount_centavos / 100,
  liters: Number(row.liters),
  odometerKm: row.odometer_km === null ? null : Number(row.odometer_km),
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
