import { rowToTruck, validateTruck, type TruckRow } from '../../../worker/trucks'
import { errorResponse, json, type Env } from '../../../worker/trips'

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = String(params.id)
    const truck = validateTruck(await request.json())
    const result = await env.DB.prepare(`UPDATE saved_trucks SET
      brand = ?, truck_type = ?, plate_number = ?, color = ?, fuel_efficiency_km_per_liter = ?, updated_at = ? WHERE id = ?`).bind(
      truck.brand, truck.truckType, truck.plateNumber, truck.color, truck.fuelEfficiencyKmPerLiter, new Date().toISOString(), id,
    ).run()
    if (!result.meta.changes) return json({ error: 'Truck not found.' }, 404)
    const row = await env.DB.prepare('SELECT * FROM saved_trucks WHERE id = ?').bind(id).first<TruckRow>()
    return json(rowToTruck(row!))
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'A truck with this plate number is already saved.' }, 409)
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM saved_trucks WHERE id = ?').bind(String(params.id)).run()
    if (!result.meta.changes) return json({ error: 'Truck not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
