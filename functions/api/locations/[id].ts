import { rowToSavedLocation, validateSavedLocation, type SavedLocationRow } from '../../../worker/locations'
import { errorResponse, json, type Env } from '../../../worker/trips'

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = String(params.id)
    const location = validateSavedLocation(await request.json())
    const result = await env.DB.prepare(`UPDATE saved_locations SET
      name = ?, province_code = ?, province = ?, city_code = ?, city = ?, barangay_code = ?, barangay = ?, address = ?, updated_at = ?
      WHERE id = ?`)
      .bind(location.name, location.provinceCode, location.province, location.cityCode, location.city, location.barangayCode, location.barangay, location.address, new Date().toISOString(), id).run()
    if (!result.meta.changes) return json({ error: 'Saved location not found.' }, 404)
    const row = await env.DB.prepare('SELECT * FROM saved_locations WHERE id = ?').bind(id).first<SavedLocationRow>()
    return json(rowToSavedLocation(row!))
  } catch (error) {
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'A saved location with this name already exists.' }, 409)
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM saved_locations WHERE id = ?').bind(String(params.id)).run()
    if (!result.meta.changes) return json({ error: 'Saved location not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
