import { rowToPersonnel, validatePersonnel, type PersonnelRow } from '../../../worker/personnel'
import { errorResponse, json, type Env } from '../../../worker/trips'

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = String(params.id)
    const person = validatePersonnel(await request.json())
    const result = await env.DB.prepare(`UPDATE saved_personnel SET
      role = ?, name = ?, default_rate_centavos = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ? WHERE id = ?`)
      .bind(person.role, person.name, Math.round(person.defaultRate * 100), person.startDate, person.endDate, person.isActive ? 1 : 0, new Date().toISOString(), id).run()
    if (!result.meta.changes) return json({ error: 'Crew member not found.' }, 404)
    const row = await env.DB.prepare('SELECT * FROM saved_personnel WHERE id = ?').bind(id).first<PersonnelRow>()
    return json(rowToPersonnel(row!))
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return json({ error: 'This name is already saved for that role.' }, 409)
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400)
    return errorResponse(error)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const result = await env.DB.prepare('DELETE FROM saved_personnel WHERE id = ?').bind(String(params.id)).run()
    if (!result.meta.changes) return json({ error: 'Crew member not found.' }, 404)
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
