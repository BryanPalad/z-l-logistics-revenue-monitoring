import { latLngBounds, type LatLngExpression } from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface Waypoint {
  lat: number
  lon: number
  label: string
  markerText: string
}

interface RouteData {
  waypoints: Waypoint[]
  geometry: number[][]
}

interface Props {
  tripId: string
  routeCalculatedAt: string
}

const markerColor = (marker: string) => marker === 'S' ? '#168159' : marker === 'P' ? '#ea8a2f' : marker === 'E' ? '#d04747' : '#3157d5'

function FitRoute({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize()
      map.fitBounds(latLngBounds(positions), { padding: [36, 36], maxZoom: 15 })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [map, positions])
  return null
}

export function InteractiveRouteMap({ tripId, routeCalculatedAt }: Props) {
  const [data, setData] = useState<RouteData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/trips/${encodeURIComponent(tripId)}/route?v=${encodeURIComponent(routeCalculatedAt)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('The interactive route could not be loaded.')
        return response.json() as Promise<RouteData>
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The interactive route could not be loaded.')
      })
    return () => controller.abort()
  }, [routeCalculatedAt, tripId])

  const positions = useMemo<LatLngExpression[]>(() =>
    data?.geometry.map(([lon, lat]) => [lat, lon] as LatLngExpression) ?? [], [data])

  if (error) return <div className="interactive-map-status">{error}</div>
  if (!data || !positions.length) return <div className="interactive-map-status"><span className="spinner" /> Loading interactive map…</div>

  return <MapContainer center={positions[0]} zoom={10} minZoom={5} maxZoom={19} scrollWheelZoom zoomControl attributionControl className="interactive-route-map">
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
    <Polyline positions={positions} pathOptions={{ color: '#3157d5', opacity: 0.92, weight: 5 }} />
    {data.waypoints.map((waypoint, index) => <CircleMarker
      key={`${waypoint.markerText}-${index}`}
      center={[waypoint.lat, waypoint.lon]}
      radius={14}
      pathOptions={{ color: '#fff', weight: 3, fillColor: markerColor(waypoint.markerText), fillOpacity: 1 }}
    ><Tooltip permanent direction="center" className="route-marker-label"><span title={waypoint.label}>{waypoint.markerText}</span></Tooltip></CircleMarker>)}
    <FitRoute positions={positions} />
  </MapContainer>
}
