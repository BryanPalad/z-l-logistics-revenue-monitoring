import { CalendarDays, Clock3, Edit3, Flag, Map, MapPin, Maximize2, Navigation, ReceiptText, Route, Truck, UserRound, X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import type { Trip } from '../types'
import { formatDate, formatDistance, formatDriverHours, formatDuration, formatPeso, getDriverDailyMinutes, getDriverMinutes, getEstimatedProfit, getOtherExpenses, getTotalExpenses, getTotalRevenue } from '../utils/calculations'
import { InteractiveRouteMap } from './InteractiveRouteMap'

interface Props {
  trip: Trip
  trips: Trip[]
  onClose: () => void
  onEdit: (trip: Trip) => void
}

const routeText = (address: string, barangay: string, city: string, province: string, fallback = 'Not specified') =>
  [address, barangay, city, province].filter(Boolean).join(', ') || fallback

const formatTime = (time: string) => time ? new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${time}:00`)) : '—'

export function TripDetailsModal({ trip, trips, onClose, onEdit }: Props) {
  const profit = getEstimatedProfit(trip)
  const [mapFailed, setMapFailed] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)
  const driverMinutes = getDriverMinutes(trip)
  const dailyDriverMinutes = getDriverDailyMinutes(trip, trips)
  const hasDailyDriverHours = trips.some((candidate) =>
    candidate.tripDate === trip.tripDate
    && candidate.driverName.trim().toLocaleLowerCase() === trip.driverName.trim().toLocaleLowerCase()
    && getDriverMinutes(candidate) != null)
  const routePoints = [
    { type: 'start', label: 'STARTING LOCATION', address: routeText(trip.homeAddress, trip.homeBarangay, trip.homeCity, trip.homeProvince) },
    { type: 'pickup', label: 'PICK UP LOCATION', address: routeText(trip.originAddress, trip.originBarangay, trip.originCity, trip.originProvince) },
    { type: 'dropoff', label: 'DROP-OFF 1', address: routeText(trip.destinationAddress, trip.destinationBarangay, trip.destinationCity, trip.destinationProvince, trip.destination) },
    ...trip.dropOffs.map((dropOff, index) => ({
      type: 'dropoff', label: `DROP-OFF ${index + 2}`,
      address: routeText(dropOff.destinationAddress, dropOff.destinationBarangay, dropOff.destinationCity, dropOff.destinationProvince),
    })),
    { type: 'end', label: 'ENDING LOCATION', address: routeText(trip.endingAddress, trip.endingBarangay, trip.endingCity, trip.endingProvince) },
  ]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (mapExpanded) setMapExpanded(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [mapExpanded, onClose])

  const routeMapUrl = `/api/trips/${encodeURIComponent(trip.id)}/route-map?v=${encodeURIComponent(trip.routeCalculatedAt)}`
  const openMap = () => setMapExpanded(true)

  return (
    <div className="modal-backdrop details-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="trip-details-dialog" role="dialog" aria-modal="true" aria-labelledby="trip-details-title">
        <header className="details-header">
          <div><span className="eyebrow">TRIP DETAILS</span><h2 id="trip-details-title">{trip.truckPlateNumber}</h2><p>{formatDate(trip.tripDate)} · {trip.customerName || 'No warehouse / hub specified'}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close trip details"><X size={20} /></button>
        </header>

        <div className="details-content">
          <section className="details-route">
            {routePoints.map((point, index) => <Fragment key={`${point.label}-${index}`}>
              {index > 0 && <i aria-hidden="true" />}
              <div><span>{point.type === 'start' ? <Navigation size={17} /> : point.type === 'end' ? <Flag size={17} /> : <MapPin size={17} />}</span><div><small>{point.label}</small><strong>{point.address}</strong></div></div>
            </Fragment>)}
          </section>

          <section className="details-section route-estimate-section">
            <h3><Route size={16} /> Estimated driving route</h3>
            <div className="route-estimate-summary">
              <div><Route size={17} /><span><small>Total route distance</small><strong>{formatDistance(trip.routeDistanceMeters)}</strong></span></div>
              <div><Navigation size={17} /><span><small>Pick up to all drop-offs</small><strong>{formatDistance(trip.deliveryDistanceMeters)}</strong></span></div>
              <div><Clock3 size={17} /><span><small>Total drive time</small><strong>{formatDuration(trip.routeDurationSeconds)}</strong></span></div>
              <div><MapPin size={17} /><span><small>Drop-offs</small><strong>{trip.dropOffs.length + 1}</strong></span></div>
            </div>
            {trip.routeDistanceMeters != null && !mapFailed ? (
              <figure className="route-map">
                <button type="button" className="route-map-open" onClick={openMap} aria-label="Open and zoom the route map">
                  <img src={routeMapUrl} alt={`Estimated route from ${trip.homeCity} to ${trip.endingCity} through ${trip.dropOffs.length + 1} drop-offs`} loading="lazy" onError={() => setMapFailed(true)} />
                  <span><Maximize2 size={15} /> Click to enlarge</span>
                </button>
                <figcaption>Estimated route · Map data © OpenStreetMap contributors, © OpenMapTiles · Powered by Geoapify</figcaption>
              </figure>
            ) : (
              <div className="route-map-empty"><Map size={22} /><p>{mapFailed ? 'The route map could not be loaded.' : 'A route estimate will appear after this trip is saved with map services configured.'}</p></div>
            )}
            <p className="route-disclaimer">Distance and time are estimates based on the selected stops and may differ from the actual road conditions.</p>
          </section>

          <section className="details-section">
            <h3><Truck size={16} /> Trip information</h3>
            <div className="details-grid">
              <div><small><CalendarDays size={13} /> Trip date</small><strong>{formatDate(trip.tripDate)}</strong></div>
              <div><small><Truck size={13} /> Truck plate</small><strong>{trip.truckPlateNumber}</strong></div>
              <div><small><UserRound size={13} /> Driver</small><strong>{trip.driverName}</strong></div>
              <div><small><UserRound size={13} /> Helper</small><strong>{trip.helperName || '—'}</strong></div>
              <div><small><Clock3 size={13} /> Driver start time</small><strong>{formatTime(trip.driverStartTime)}</strong></div>
              <div><small><Clock3 size={13} /> Driver end time</small><strong>{formatTime(trip.driverEndTime)}</strong></div>
              <div><small>Hours for this trip</small><strong>{formatDriverHours(driverMinutes)}</strong></div>
              <div><small>Total recorded hours for this date</small><strong>{hasDailyDriverHours ? formatDriverHours(dailyDriverMinutes) : '—'}</strong></div>
              <div className="details-wide"><small>Warehouse / Hub</small><strong>{trip.customerName || '—'}</strong></div>
            </div>
          </section>

          <section className="details-section">
            <h3><ReceiptText size={16} /> Revenue and expenses</h3>
            <div className="details-grid money-details">
              <div className="details-wide"><small>Total revenue</small><strong>{formatPeso(getTotalRevenue(trip))}</strong></div>
              <div><small>Driver rate</small><strong>{formatPeso(trip.driverRate)}</strong></div>
              <div><small>Helper rate</small><strong>{formatPeso(trip.helperRate)}</strong></div>
              <div><small>Gas expense</small><strong>{formatPeso(trip.gasExpense)}</strong></div>
              <div><small>Parking expense</small><strong>{formatPeso(trip.parkingExpense)}</strong></div>
              <div><small>Toll expense</small><strong>{formatPeso(trip.tollExpense)}</strong></div>
              <div><small>Food expense</small><strong>{formatPeso(trip.foodExpense)}</strong></div>
              <div><small>Other expense</small><strong>{formatPeso(trip.otherExpense)}</strong></div>
              <div><small>Other expenses total</small><strong>{formatPeso(getOtherExpenses(trip))}</strong></div>
              <div><small>Total expenses</small><strong>{formatPeso(getTotalExpenses(trip))}</strong></div>
              <div className={`details-profit details-wide ${profit < 0 ? 'negative' : ''}`}><small>Estimated profit</small><strong>{formatPeso(profit)}</strong></div>
            </div>
          </section>

          <section className="details-section details-remarks">
            <h3>Remarks</h3><p>{trip.remarks || 'No remarks for this trip.'}</p>
          </section>
        </div>

        <footer className="details-footer"><button className="secondary-button" onClick={onClose}>Close</button><button className="primary-button" onClick={() => onEdit(trip)}><Edit3 size={16} /> Edit trip</button></footer>
      </article>
      {mapExpanded && <div className="route-map-lightbox" role="dialog" aria-modal="true" aria-label="Expanded route map" onMouseDown={(event) => event.target === event.currentTarget && setMapExpanded(false)}>
        <div className="route-map-viewer">
          <header><div><strong>Interactive route map</strong><small>View only</small></div><button type="button" className="icon-button" onClick={() => setMapExpanded(false)} aria-label="Close interactive map"><X size={19} /></button></header>
          <div className="route-map-stage"><InteractiveRouteMap tripId={trip.id} routeCalculatedAt={trip.routeCalculatedAt} /></div>
          <p>Drag to move the map. Use the +/− controls, mouse wheel, or pinch gesture to zoom.</p>
        </div>
      </div>}
    </div>
  )
}
