import { CalendarDays, Clock3, Edit3, Map, MapPin, Navigation, ReceiptText, Route, Truck, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Trip } from '../types'
import { formatDate, formatDistance, formatDuration, formatPeso, getAdditionalRevenue, getEstimatedProfit, getOtherExpenses, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props {
  trip: Trip
  onClose: () => void
  onEdit: (trip: Trip) => void
}

const routeText = (address: string, barangay: string, city: string, province: string, fallback = 'Not specified') =>
  [address, barangay, city, province].filter(Boolean).join(', ') || fallback

export function TripDetailsModal({ trip, onClose, onEdit }: Props) {
  const profit = getEstimatedProfit(trip)
  const [mapFailed, setMapFailed] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [onClose])

  return (
    <div className="modal-backdrop details-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="trip-details-dialog" role="dialog" aria-modal="true" aria-labelledby="trip-details-title">
        <header className="details-header">
          <div><span className="eyebrow">TRIP DETAILS</span><h2 id="trip-details-title">{trip.truckPlateNumber}</h2><p>{formatDate(trip.tripDate)} · {trip.customerName || 'No customer specified'}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close trip details"><X size={20} /></button>
        </header>

        <div className="details-content">
          <section className="details-route">
            <div><span><Navigation size={17} /></span><div><small>FROM</small><strong>{routeText(trip.originAddress, trip.originBarangay, trip.originCity, trip.originProvince)}</strong></div></div>
            <i aria-hidden="true" />
            <div><span><MapPin size={17} /></span><div><small>TO</small><strong>{routeText(trip.destinationAddress, trip.destinationBarangay, trip.destinationCity, trip.destinationProvince, trip.destination)}</strong></div></div>
            {trip.subTrips.map((subTrip, index) => (
              <div className="details-additional-route" key={subTrip.id}><span><MapPin size={17} /></span><div><small>ADDITIONAL ROUTE {index + 1}</small><strong>{routeText(subTrip.destinationAddress, subTrip.destinationBarangay, subTrip.destinationCity, subTrip.destinationProvince)}</strong><em>{formatPeso(subTrip.customerRate)} additional revenue</em></div></div>
            ))}
          </section>

          <section className="details-section route-estimate-section">
            <h3><Route size={16} /> Estimated driving route</h3>
            <div className="route-estimate-summary">
              <div><Route size={17} /><span><small>Distance</small><strong>{formatDistance(trip.routeDistanceMeters)}</strong></span></div>
              <div><Clock3 size={17} /><span><small>Drive time</small><strong>{formatDuration(trip.routeDurationSeconds)}</strong></span></div>
            </div>
            {trip.routeDistanceMeters != null && !mapFailed ? (
              <figure className="route-map">
                <img src={`/api/trips/${encodeURIComponent(trip.id)}/route-map`} alt={`Estimated driving route from ${trip.originCity} to ${trip.destinationCity}`} loading="lazy" onError={() => setMapFailed(true)} />
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
              <div className="details-wide"><small>Customer</small><strong>{trip.customerName || '—'}</strong></div>
            </div>
          </section>

          <section className="details-section">
            <h3><ReceiptText size={16} /> Revenue and expenses</h3>
            <div className="details-grid money-details">
              <div><small>Main revenue</small><strong>{formatPeso(trip.revenue)}</strong></div>
              <div><small>Additional revenue</small><strong>{formatPeso(getAdditionalRevenue(trip))}</strong></div>
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
    </div>
  )
}
