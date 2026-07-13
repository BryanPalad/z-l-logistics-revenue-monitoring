import { errorResponse, json, type Env } from '../../../../worker/trips'

interface RouteMapRow {
  route_waypoints_json: string
  route_geometry_json: string
}

interface Waypoint {
  lat: number
  lon: number
  label: string
}

const parseJson = <T>(value: string, fallback: T): T => {
  try { return JSON.parse(value) as T } catch { return fallback }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  try {
    if (!env.GEOAPIFY_API_KEY) return json({ error: 'Route maps are not configured.' }, 404)
    const row = await env.DB.prepare(
      'SELECT route_waypoints_json, route_geometry_json FROM trips WHERE id = ?',
    ).bind(String(params.id)).first<RouteMapRow>()
    if (!row) return json({ error: 'Trip not found.' }, 404)

    const waypoints = parseJson<Waypoint[]>(row.route_waypoints_json, [])
    const geometry = parseJson<number[][]>(row.route_geometry_json, [])
    if (waypoints.length < 2 || !geometry.length) return json({ error: 'No route map is available for this trip.' }, 404)

    const url = new URL('https://maps.geoapify.com/v1/staticmap')
    url.searchParams.set('apiKey', env.GEOAPIFY_API_KEY)
    const mapResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        style: 'osm-bright', width: 900, height: 420, scaleFactor: 1,
        markers: waypoints.map(({ lat, lon }, index) => ({
          lat, lon, type: 'circle', color: index === 0 ? '#168159' : index === waypoints.length - 1 ? '#d04747' : '#3157d5',
          size: 'medium', text: String(index + 1), textsize: 'small',
        })),
        geometries: [{
          type: 'polyline', linecolor: '#3157d5', lineopacity: 0.9, linewidth: 5,
          value: geometry.map(([lon, lat]) => ({ lat, lon })),
        }],
      }),
    })
    if (!mapResponse.ok) throw new Error('The route map could not be generated.')
    const headers = new Headers()
    headers.set('Content-Type', mapResponse.headers.get('Content-Type') || 'image/png')
    headers.set('Cache-Control', 'private, max-age=86400')
    return new Response(mapResponse.body, { status: 200, headers })
  } catch (error) {
    return errorResponse(error)
  }
}
