import { Copy, Edit3, Trash2, Truck } from 'lucide-react'
import type { Trip } from '../types'
import { formatDate, formatPeso, getEstimatedProfit, getOtherExpenses, getTotalExpenses } from '../utils/calculations'

interface Props {
  trips: Trip[]
  hasTrips: boolean
  onEdit: (trip: Trip) => void
  onDuplicate: (trip: Trip) => void
  onDelete: (trip: Trip) => void
  onNew: () => void
}

export function TripTable({ trips, hasTrips, onEdit, onDuplicate, onDelete, onNew }: Props) {
  if (!trips.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Truck size={29} /></div>
        <h3>{hasTrips ? 'No matching trips' : 'No trips yet'}</h3>
        <p>{hasTrips ? 'Try adjusting your search to find another record.' : "Click 'New Trip' to create your first logistics record."}</p>
        {!hasTrips && <button className="text-button" onClick={onNew}>Create a trip →</button>}
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table>
        <thead><tr>
          <th>Date</th><th>Truck Plate</th><th>Driver</th><th>Helper</th><th>Destination</th><th>Customer</th>
          <th className="number">Revenue</th><th className="number">Driver Rate</th><th className="number">Helper Rate</th>
          <th className="number">Gas Expense</th><th className="number">Other Expenses</th><th className="number">Total Expenses</th>
          <th className="number">Est. Profit</th><th>Remarks</th><th className="actions-heading">Actions</th>
        </tr></thead>
        <tbody>{trips.map((trip) => {
          const profit = getEstimatedProfit(trip)
          return (
            <tr key={trip.id}>
              <td className="date-cell">{formatDate(trip.tripDate)}</td>
              <td><span className="plate">{trip.truckPlateNumber}</span></td>
              <td className="primary-cell">{trip.driverName}</td><td>{trip.helperName || '—'}</td>
              <td>{trip.destination}</td><td>{trip.customerName || '—'}</td>
              <td className="number revenue-cell">{formatPeso(trip.revenue)}</td>
              <td className="number">{formatPeso(trip.driverRate)}</td><td className="number">{formatPeso(trip.helperRate)}</td>
              <td className="number">{formatPeso(trip.gasExpense)}</td><td className="number">{formatPeso(getOtherExpenses(trip))}</td>
              <td className="number">{formatPeso(getTotalExpenses(trip))}</td>
              <td className={`number profit-cell ${profit < 0 ? 'negative' : ''}`}>{formatPeso(profit)}</td>
              <td className="remarks-cell" title={trip.remarks}>{trip.remarks || '—'}</td>
              <td className="actions-cell">
                <div className="row-actions">
                  <button className="row-action edit" onClick={() => onEdit(trip)} title="Edit trip" aria-label={`Edit trip to ${trip.destination}`}><Edit3 size={15} /><span>Edit</span></button>
                  <button className="row-action" onClick={() => onDuplicate(trip)} title="Duplicate trip" aria-label={`Duplicate trip to ${trip.destination}`}><Copy size={15} /><span>Duplicate</span></button>
                  <button className="row-action delete" onClick={() => onDelete(trip)} title="Delete trip" aria-label={`Delete trip to ${trip.destination}`}><Trash2 size={15} /><span>Delete</span></button>
                </div>
              </td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  )
}
