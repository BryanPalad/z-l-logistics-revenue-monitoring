import type { TripInput } from '../types'

export const getOtherExpenses = (trip: TripInput) =>
  trip.parkingExpense + trip.tollExpense + trip.foodExpense + trip.otherExpense

export const getTotalExpenses = (trip: TripInput) =>
  trip.driverRate + trip.helperRate + trip.gasExpense + getOtherExpenses(trip)

export const getEstimatedProfit = (trip: TripInput) => trip.revenue - getTotalExpenses(trip)

export const formatPeso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0)

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )
