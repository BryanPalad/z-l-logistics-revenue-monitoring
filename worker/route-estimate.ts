import type { Env, TripInputPayload } from './trips'

interface Coordinate {
  lat: number
  lon: number
  label: string
}

interface GeocodingResponse {
  results?: Array<{ lat?: number; lon?: number }>
}

interface RoutingResponse {
  features?: Array<{
    properties?: { distance?: number; time?: number }
    geometry?: { type?: string; coordinates?: unknown }
  }>
}

interface RouteGeometry {
  type?: string
  coordinates?: unknown
}

const addressText = (address: string, barangay: string, city: string, province: string) =>
  [address, barangay, city, province, 'Philippines'].filter(Boolean).join(', ')

const routeStops = (trip: TripInputPayload) => [
  { label: 'From', query: addressText(trip.originAddress, trip.originBarangay, trip.originCity, trip.originProvince) },
  { label: 'Main destination', query: addressText(trip.destinationAddress, trip.destinationBarangay, trip.destinationCity, trip.destinationProvince) },
  ...trip.subTrips.map((subTrip, index) => ({
    label: `Additional route ${index + 1}`,
    query: addressText(subTrip.destinationAddress, subTrip.destinationBarangay, subTrip.destinationCity, subTrip.destinationProvince),
  })),
]

const geocode = async (query: string, label: string, apiKey: string): Promise<Coordinate> => {
  const url = new URL('https://api.geoapify.com/v1/geocode/search')
  url.search = new URLSearchParams({ text: query, filter: 'countrycode:ph', limit: '1', format: 'json', apiKey }).toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not locate ${label}.`)
  const result = (await response.json() as GeocodingResponse).results?.[0]
  if (!result || !Number.isFinite(result.lat) || !Number.isFinite(result.lon)) throw new Error(`Could not locate ${label}.`)
  return { lat: Number(result.lat), lon: Number(result.lon), label }
}

const flattenGeometry = (geometry: RouteGeometry | undefined) => {
  if (!geometry || typeof geometry !== 'object' || !('coordinates' in geometry)) return [] as number[][]
  const coordinates = geometry.coordinates
  if (!Array.isArray(coordinates)) return [] as number[][]
  if (geometry.type === 'LineString') return coordinates as number[][]
  if (geometry.type === 'MultiLineString') return (coordinates as number[][][]).flat()
  return [] as number[][]
}

export async function refreshRouteEstimate(env: Env, id: string, trip: TripInputPayload) {
  const clearEstimate = () => env.DB.prepare(`UPDATE trips SET
    route_distance_meters = NULL, route_duration_seconds = NULL, route_waypoints_json = '[]',
    route_geometry_json = '[]', route_calculated_at = '' WHERE id = ?`).bind(id).run()
  if (!env.GEOAPIFY_API_KEY) {
    await clearEstimate()
    return
  }

  try {
    const waypoints: Coordinate[] = []
    const stops = routeStops(trip)
    for (let index = 0; index < stops.length; index += 4) {
      const batch = stops.slice(index, index + 4)
      waypoints.push(...await Promise.all(batch.map((stop) => geocode(stop.query, stop.label, env.GEOAPIFY_API_KEY!))))
      if (index + 4 < stops.length) await new Promise((resolve) => setTimeout(resolve, 1_100))
    }

    const url = new URL('https://api.geoapify.com/v1/routing')
    url.search = new URLSearchParams({
      waypoints: waypoints.map(({ lat, lon }) => `${lat},${lon}`).join('|'),
      mode: 'drive',
      format: 'geojson',
      apiKey: env.GEOAPIFY_API_KEY,
    }).toString()
    const response = await fetch(url)
    if (!response.ok) throw new Error('The driving route could not be calculated.')
    const feature = (await response.json() as RoutingResponse).features?.[0]
    const distance = Math.round(Number(feature?.properties?.distance))
    const duration = Math.round(Number(feature?.properties?.time))
    const geometry = flattenGeometry(feature?.geometry)
    if (!Number.isFinite(distance) || !Number.isFinite(duration) || !geometry.length) throw new Error('The route response was incomplete.')

    await env.DB.prepare(`UPDATE trips SET
      route_distance_meters = ?, route_duration_seconds = ?, route_waypoints_json = ?,
      route_geometry_json = ?, route_calculated_at = ? WHERE id = ?`)
      .bind(distance, duration, JSON.stringify(waypoints), JSON.stringify(geometry), new Date().toISOString(), id).run()
  } catch (error) {
    console.error('Route estimate failed:', error)
    await clearEstimate()
  }
}
