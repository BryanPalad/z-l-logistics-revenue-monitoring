import { errorResponse, insertValues, json, rowToTrip, validateTrip, type Env } from '../../worker/trips'

const INSERT_SQL = `INSERT INTO trips (
  id, trip_date, truck_plate_number, driver_name, helper_name, destination, customer_name,
  revenue_centavos, driver_rate_centavos, helper_rate_centavos, gas_expense_centavos,
  parking_expense_centavos, toll_expense_centavos, food_expense_centavos, other_expense_centavos,
  remarks, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM trips ORDER BY trip_date DESC, created_at DESC').all()
    return json(result.results.map((row) => rowToTrip(row as never)))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const trip = validateTrip(await request.json())
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(INSERT_SQL).bind(...insertValues(trip, id, now)).run()
    return json({ ...trip, id, createdAt: now, updatedAt: now }, 201)
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('required'))) {
      return json({ error: error instanceof Error ? error.message : 'Invalid trip data.' }, 400)
    }
    return errorResponse(error)
  }
}
