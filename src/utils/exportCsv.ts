import type { Trip } from '../types'
import { formatDistance, formatDuration, formatPeso, getAdditionalRevenue, getEstimatedProfit, getOtherExpenses, getTotalExpenses, getTotalRevenue } from './calculations'

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export function exportTripsToCsv(trips: Trip[]) {
  const headers = [
    'Date', 'Truck Plate', 'Driver', 'Helper',
    'From Province', 'From City/Municipality', 'From Barangay', 'From Exact Address',
    'To Province', 'To City/Municipality', 'To Barangay', 'To Exact Address', 'Additional Routes', 'Estimated Distance', 'Estimated Drive Time', 'Customer',
    'Main Revenue', 'Additional Revenue', 'Total Revenue',
    'Driver Rate', 'Helper Rate', 'Gas Expense', 'Other Expenses', 'Total Expenses',
    'Estimated Profit', 'Remarks',
  ]
  const rows = trips.map((trip) => [
    trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.helperName,
    trip.originProvince, trip.originCity, trip.originBarangay, trip.originAddress,
    trip.destinationProvince, trip.destinationCity, trip.destinationBarangay, trip.destinationAddress,
    trip.subTrips.map((subTrip, index) => `${index + 1}. ${[subTrip.destinationAddress, subTrip.destinationBarangay, subTrip.destinationCity, subTrip.destinationProvince].filter(Boolean).join(', ')} (${formatPeso(subTrip.customerRate)})`).join(' | '),
    formatDistance(trip.routeDistanceMeters), formatDuration(trip.routeDurationSeconds), trip.customerName,
    trip.revenue, getAdditionalRevenue(trip), getTotalRevenue(trip), trip.driverRate, trip.helperRate, trip.gasExpense,
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
