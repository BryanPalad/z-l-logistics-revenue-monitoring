import type { Trip } from '../types'
import { getEstimatedProfit, getOtherExpenses, getTotalExpenses } from './calculations'

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export function exportTripsToCsv(trips: Trip[]) {
  const headers = [
    'Date', 'Truck Plate', 'Driver', 'Helper', 'Destination', 'Customer', 'Revenue',
    'Driver Rate', 'Helper Rate', 'Gas Expense', 'Other Expenses', 'Total Expenses',
    'Estimated Profit', 'Remarks',
  ]
  const rows = trips.map((trip) => [
    trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.helperName, trip.destination,
    trip.customerName, trip.revenue, trip.driverRate, trip.helperRate, trip.gasExpense,
    getOtherExpenses(trip), getTotalExpenses(trip), getEstimatedProfit(trip), trip.remarks,
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `logistics-trips-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
