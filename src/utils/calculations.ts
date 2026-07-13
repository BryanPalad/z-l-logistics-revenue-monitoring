import type { TripInput } from '../types'

export const getOtherExpenses = (trip: TripInput) =>
  trip.parkingExpense + trip.tollExpense + trip.foodExpense + trip.otherExpense

export const getTotalExpenses = (trip: TripInput) =>
  trip.driverRate + trip.helperRate + trip.gasExpense + getOtherExpenses(trip)

export const getAdditionalRevenue = (trip: TripInput) =>
  (trip.subTrips ?? []).reduce((sum, subTrip) => sum + subTrip.customerRate, 0)

export const getTotalRevenue = (trip: TripInput) => trip.revenue + getAdditionalRevenue(trip)

export const getEstimatedProfit = (trip: TripInput) => getTotalRevenue(trip) - getTotalExpenses(trip)

export const formatPeso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0)

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export const formatDistance = (meters: number | null | undefined) =>
  Number.isFinite(meters) ? `${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 }).format(Number(meters) / 1000)} km` : '—'

export const formatDuration = (seconds: number | null | undefined) => {
  if (!Number.isFinite(seconds)) return '—'
  const totalMinutes = Math.max(1, Math.round(Number(seconds) / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours} hr${hours === 1 ? '' : 's'}${minutes ? ` ${minutes} min` : ''}` : `${minutes} min`
}
