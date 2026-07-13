import type { Trip } from '../types'
import { formatDistance, formatDriverHours, formatDuration, getDriverMinutes, getEstimatedProfit, getOtherExpenses, getTotalExpenses, getTotalRevenue } from './calculations'

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export function exportTripsToCsv(trips: Trip[]) {
  const headers = [
    'Date', 'Truck Plate', 'Driver', 'Driver Start Time', 'Driver End Time', 'Driver Hours', 'Helper',
    'Starting Province', 'Starting City/Municipality', 'Starting Barangay', 'Starting Exact Address',
    'Pick Up Province', 'Pick Up City/Municipality', 'Pick Up Barangay', 'Pick Up Exact Address',
    'Drop-off 1 Province', 'Drop-off 1 City/Municipality', 'Drop-off 1 Barangay', 'Drop-off 1 Exact Address',
    'Additional Drop-offs',
    'Ending Province', 'Ending City/Municipality', 'Ending Barangay', 'Ending Exact Address',
    'Total Route Distance', 'Pick Up to Drop-offs Distance', 'Estimated Drive Time', 'Warehouse / Hub',
    'Total Revenue',
    'Driver Rate', 'Helper Rate', 'Gas Expense', 'Other Expenses', 'Total Expenses',
    'Estimated Profit', 'Remarks',
  ]
  const rows = trips.map((trip) => [
    trip.tripDate, trip.truckPlateNumber, trip.driverName, trip.driverStartTime, trip.driverEndTime, formatDriverHours(getDriverMinutes(trip)), trip.helperName,
    trip.homeProvince, trip.homeCity, trip.homeBarangay, trip.homeAddress,
    trip.originProvince, trip.originCity, trip.originBarangay, trip.originAddress,
    trip.destinationProvince, trip.destinationCity, trip.destinationBarangay, trip.destinationAddress,
    trip.dropOffs.map((dropOff, index) => `${index + 2}. ${[dropOff.destinationAddress, dropOff.destinationBarangay, dropOff.destinationCity, dropOff.destinationProvince].filter(Boolean).join(', ')}`).join(' | '),
    trip.endingProvince, trip.endingCity, trip.endingBarangay, trip.endingAddress,
    formatDistance(trip.routeDistanceMeters), formatDistance(trip.deliveryDistanceMeters), formatDuration(trip.routeDurationSeconds), trip.customerName,
    getTotalRevenue(trip), trip.driverRate, trip.helperRate, trip.gasExpense,
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
