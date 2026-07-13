export interface Env {
  DB: D1Database
  APP_PIN?: string
  SESSION_SECRET?: string
  GEOAPIFY_API_KEY?: string
}

export interface SubTripPayload {
  id: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
  customerRate: number
}

export interface TripInputPayload {
  tripDate: string
  truckPlateNumber: string
  driverName: string
  helperName: string
  originProvinceCode: string
  originProvince: string
  originCityCode: string
  originCity: string
  originBarangayCode: string
  originBarangay: string
  originAddress: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
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
  subTrips: SubTripPayload[]
  remarks: string
}

export interface TripRow {
  id: string
  trip_date: string
  truck_plate_number: string
  driver_name: string
  helper_name: string
  origin_province_code: string
  origin_province: string
  origin_city_code: string
  origin_city: string
  origin_barangay_code: string
  origin_barangay: string
  origin_address: string
  destination_province_code: string
  destination_province: string
  destination_city_code: string
  destination_city: string
  destination_barangay_code: string
  destination_barangay: string
  destination_address: string
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
  sub_trips_json: string
  route_distance_meters: number | null
  route_duration_seconds: number | null
  route_waypoints_json: string
  route_geometry_json: string
  route_calculated_at: string
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
  for (const field of ['tripDate', 'truckPlateNumber', 'driverName', 'originProvince', 'originCity', 'destinationProvince', 'destinationCity']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error(`${field} is required.`)
  }
  const trip = input as unknown as TripInputPayload
  for (const field of moneyFields) {
    if (!Number.isFinite(Number(trip[field])) || Number(trip[field]) < 0) throw new Error(`${field} must be zero or greater.`)
  }
  if (trip.revenue <= 0 || trip.driverRate <= 0) throw new Error('Revenue and driver rate must be greater than zero.')
  const originProvince = String(trip.originProvince ?? '').trim()
  const originCity = String(trip.originCity ?? '').trim()
  const originBarangay = String(trip.originBarangay ?? '').trim()
  const originAddress = String(trip.originAddress ?? '').trim()
  const destinationProvince = String(trip.destinationProvince ?? '').trim()
  const destinationCity = String(trip.destinationCity ?? '').trim()
  const destinationBarangay = String(trip.destinationBarangay ?? '').trim()
  const destinationAddress = String(trip.destinationAddress ?? '').trim()
  const rawSubTrips = Array.isArray(input.subTrips) ? input.subTrips : []
  if (rawSubTrips.length > 20) throw new Error('A trip can have up to 20 additional routes.')
  const subTrips = rawSubTrips.map((value, index): SubTripPayload => {
    if (!value || typeof value !== 'object') throw new Error(`Additional route ${index + 1} is invalid.`)
    const subTrip = value as Record<string, unknown>
    const destinationProvince = String(subTrip.destinationProvince ?? '').trim()
    const destinationCity = String(subTrip.destinationCity ?? '').trim()
    const destinationBarangay = String(subTrip.destinationBarangay ?? '').trim()
    const customerRate = Number(subTrip.customerRate)
    if (!destinationProvince || !destinationCity) throw new Error(`Additional route ${index + 1} requires a destination.`)
    if (!Number.isFinite(customerRate) || customerRate <= 0) throw new Error(`Additional route ${index + 1} customer rate must be greater than zero.`)
    return {
      id: String(subTrip.id ?? '').trim() || crypto.randomUUID(),
      destinationProvinceCode: String(subTrip.destinationProvinceCode ?? '').trim(), destinationProvince,
      destinationCityCode: String(subTrip.destinationCityCode ?? '').trim(), destinationCity,
      destinationBarangayCode: String(subTrip.destinationBarangayCode ?? '').trim(), destinationBarangay,
      destinationAddress: String(subTrip.destinationAddress ?? '').trim(), customerRate,
    }
  })
  return {
    ...trip,
    tripDate: trip.tripDate.trim(), truckPlateNumber: trip.truckPlateNumber.trim().toUpperCase(),
    driverName: trip.driverName.trim(), helperName: String(trip.helperName ?? '').trim(),
    originProvinceCode: String(trip.originProvinceCode ?? '').trim(), originProvince,
    originCityCode: String(trip.originCityCode ?? '').trim(), originCity,
    originBarangayCode: String(trip.originBarangayCode ?? '').trim(), originBarangay, originAddress,
    destinationProvinceCode: String(trip.destinationProvinceCode ?? '').trim(), destinationProvince,
    destinationCityCode: String(trip.destinationCityCode ?? '').trim(), destinationCity,
    destinationBarangayCode: String(trip.destinationBarangayCode ?? '').trim(), destinationBarangay, destinationAddress,
    destination: [destinationAddress, destinationBarangay, destinationCity, destinationProvince].filter(Boolean).join(', '),
    customerName: String(trip.customerName ?? '').trim(), subTrips,
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
  trip.originProvinceCode, trip.originProvince, trip.originCityCode, trip.originCity,
  trip.originBarangayCode, trip.originBarangay, trip.originAddress,
  trip.destinationProvinceCode, trip.destinationProvince, trip.destinationCityCode, trip.destinationCity,
  trip.destinationBarangayCode, trip.destinationBarangay, trip.destinationAddress,
  JSON.stringify(trip.subTrips),
]

export const updateValues = (trip: TripInputPayload, now: string, id: string) => [
  trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.helperName, trip.destination, trip.customerName,
  cents(trip.revenue), cents(trip.driverRate), cents(trip.helperRate), cents(trip.gasExpense),
  cents(trip.parkingExpense), cents(trip.tollExpense), cents(trip.foodExpense), cents(trip.otherExpense),
  trip.remarks, now,
  trip.originProvinceCode, trip.originProvince, trip.originCityCode, trip.originCity,
  trip.originBarangayCode, trip.originBarangay, trip.originAddress,
  trip.destinationProvinceCode, trip.destinationProvince, trip.destinationCityCode, trip.destinationCity,
  trip.destinationBarangayCode, trip.destinationBarangay, trip.destinationAddress,
  JSON.stringify(trip.subTrips),
  id,
]

const parseSubTrips = (value: string | null | undefined): SubTripPayload[] => {
  try {
    return (JSON.parse(value || '[]') as SubTripPayload[]).map((subTrip) => ({
      ...subTrip,
      destinationBarangayCode: subTrip.destinationBarangayCode ?? '',
      destinationBarangay: subTrip.destinationBarangay ?? '',
    }))
  } catch { return [] }
}

export const rowToTrip = (row: TripRow) => ({
  id: row.id, tripDate: row.trip_date, truckPlateNumber: row.truck_plate_number,
  driverName: row.driver_name, helperName: row.helper_name,
  originProvinceCode: row.origin_province_code ?? '', originProvince: row.origin_province ?? '',
  originCityCode: row.origin_city_code ?? '', originCity: row.origin_city ?? '',
  originBarangayCode: row.origin_barangay_code ?? '', originBarangay: row.origin_barangay ?? '', originAddress: row.origin_address ?? '',
  destinationProvinceCode: row.destination_province_code ?? '', destinationProvince: row.destination_province ?? '',
  destinationCityCode: row.destination_city_code ?? '', destinationCity: row.destination_city ?? '',
  destinationBarangayCode: row.destination_barangay_code ?? '', destinationBarangay: row.destination_barangay ?? '',
  destinationAddress: row.destination_address ?? row.destination, destination: row.destination,
  customerName: row.customer_name, revenue: pesos(row.revenue_centavos), driverRate: pesos(row.driver_rate_centavos),
  helperRate: pesos(row.helper_rate_centavos), gasExpense: pesos(row.gas_expense_centavos),
  parkingExpense: pesos(row.parking_expense_centavos), tollExpense: pesos(row.toll_expense_centavos),
  foodExpense: pesos(row.food_expense_centavos), otherExpense: pesos(row.other_expense_centavos),
  subTrips: parseSubTrips(row.sub_trips_json), remarks: row.remarks,
  routeDistanceMeters: row.route_distance_meters ?? null, routeDurationSeconds: row.route_duration_seconds ?? null,
  routeCalculatedAt: row.route_calculated_at ?? '',
  createdAt: row.created_at, updatedAt: row.updated_at,
})

export const selectTrip = async (db: D1Database, id: string) => {
  const row = await db.prepare('SELECT * FROM trips WHERE id = ?').bind(id).first<TripRow>()
  return row ? rowToTrip(row) : null
}
