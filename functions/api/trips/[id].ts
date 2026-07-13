import { errorResponse, json, selectTrip, updateValues, validateTrip, type Env } from '../../../worker/trips'

const UPDATE_SQL = `UPDATE trips SET
  trip_date = ?, truck_plate_number = ?, driver_name = ?, helper_name = ?, destination = ?, customer_name = ?,
  revenue_centavos = ?, driver_rate_centavos = ?, helper_rate_centavos = ?, gas_expense_centavos = ?,
  parking_expense_centavos = ?, toll_expense_centavos = ?, food_expense_centavos = ?, other_expense_centavos = ?,
  remarks = ?, updated_at = ? WHERE id = ?`

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = String(params.id)
    if (!await selectTrip(env.DB, id)) return json({ error: 'Trip not found.' }, 404)
    const trip = validateTrip(await request.json())
    const now = new Date().toISOString()
    await env.DB.prepare(UPDATE_SQL).bind(...updateValues(trip, now, id)).run()
    return json(await selectTrip(env.DB, id))
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && !error.message.includes('D1')) {
      return json({ error: error instanceof Error ? error.message : 'Invalid trip data.' }, 400)
    }
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM trips WHERE id = ?').bind(String(params.id)).run()
    if (!result.meta.changes) return json({ error: 'Trip not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
