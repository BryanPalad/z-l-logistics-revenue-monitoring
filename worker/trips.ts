export interface Env {
  DB: D1Database
  APP_PIN?: string
  SESSION_SECRET?: string
}

export interface TripInputPayload {
  tripDate: string
  truckPlateNumber: string
  driverName: string
  helperName: string
  destination: string
  customerName: string
  revenue: number
  driverRate: number
  helperRate: number
  gasExpense: number
  parkingExpense: number
  tollExpense: number
  foodExpense: number
  otherExpense: number
  remarks: string
}

interface TripRow {
  id: string
  trip_date: string
  truck_plate_number: string
  driver_name: string
  helper_name: string
  destination: string
  customer_name: string
  revenue_centavos: number
  driver_rate_centavos: number
  helper_rate_centavos: number
  gas_expense_centavos: number
  parking_expense_centavos: number
  toll_expense_centavos: number
  food_expense_centavos: number
  other_expense_centavos: number
  remarks: string
  created_at: string
  updated_at: string
}

const moneyFields: (keyof TripInputPayload)[] = [
  'revenue', 'driverRate', 'helperRate', 'gasExpense', 'parkingExpense', 'tollExpense', 'foodExpense', 'otherExpense',
]

export const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store' },
})

export const errorResponse = (error: unknown) => {
  console.error(error)
  return json({ error: error instanceof Error ? error.message : 'An unexpected server error occurred.' }, 500)
}

export const validateTrip = (value: unknown): TripInputPayload => {
  if (!value || typeof value !== 'object') throw new Error('Invalid trip data.')
  const input = value as Record<string, unknown>
  for (const field of ['tripDate', 'truckPlateNumber', 'driverName', 'destination']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error(`${field} is required.`)
  }
  const trip = input as unknown as TripInputPayload
  for (const field of moneyFields) {
    if (!Number.isFinite(Number(trip[field])) || Number(trip[field]) < 0) throw new Error(`${field} must be zero or greater.`)
  }
  if (trip.revenue <= 0 || trip.driverRate <= 0) throw new Error('Revenue and driver rate must be greater than zero.')
  return {
    ...trip,
    tripDate: trip.tripDate.trim(), truckPlateNumber: trip.truckPlateNumber.trim().toUpperCase(),
    driverName: trip.driverName.trim(), helperName: String(trip.helperName ?? '').trim(),
    destination: trip.destination.trim(), customerName: String(trip.customerName ?? '').trim(),
    remarks: String(trip.remarks ?? '').trim(),
  }
}

const cents = (value: number) => Math.round(value * 100)
const pesos = (value: number) => value / 100

export const insertValues = (trip: TripInputPayload, id: string, now: string) => [
  id, trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.helperName, trip.destination, trip.customerName,
  cents(trip.revenue), cents(trip.driverRate), cents(trip.helperRate), cents(trip.gasExpense),
  cents(trip.parkingExpense), cents(trip.tollExpense), cents(trip.foodExpense), cents(trip.otherExpense),
  trip.remarks, now, now,
]

export const updateValues = (trip: TripInputPayload, now: string, id: string) => [
  trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.helperName, trip.destination, trip.customerName,
  cents(trip.revenue), cents(trip.driverRate), cents(trip.helperRate), cents(trip.gasExpense),
  cents(trip.parkingExpense), cents(trip.tollExpense), cents(trip.foodExpense), cents(trip.otherExpense),
  trip.remarks, now, id,
]

export const rowToTrip = (row: TripRow) => ({
  id: row.id, tripDate: row.trip_date, truckPlateNumber: row.truck_plate_number,
  driverName: row.driver_name, helperName: row.helper_name, destination: row.destination,
  customerName: row.customer_name, revenue: pesos(row.revenue_centavos), driverRate: pesos(row.driver_rate_centavos),
  helperRate: pesos(row.helper_rate_centavos), gasExpense: pesos(row.gas_expense_centavos),
  parkingExpense: pesos(row.parking_expense_centavos), tollExpense: pesos(row.toll_expense_centavos),
  foodExpense: pesos(row.food_expense_centavos), otherExpense: pesos(row.other_expense_centavos),
  remarks: row.remarks, createdAt: row.created_at, updatedAt: row.updated_at,
})

export const selectTrip = async (db: D1Database, id: string) => {
  const row = await db.prepare('SELECT * FROM trips WHERE id = ?').bind(id).first<TripRow>()
  return row ? rowToTrip(row) : null
}
