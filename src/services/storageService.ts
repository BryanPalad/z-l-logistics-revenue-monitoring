import type { Trip, TripInput } from '../types'

const LEGACY_TRIPS_KEY = 'logistics-monitor-trips-v1'
const SEARCH_KEY = 'logistics-monitor-search-v1'
const MONTH_KEY = 'logistics-monitor-month-v1'
const THEME_KEY = 'logistics-monitor-theme-v1'

const safeRead = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json', ...options.headers } : options?.headers,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'The server returned an unexpected response.' })) as { error?: string }
    if (response.status === 401) window.dispatchEvent(new Event('auth-expired'))
    throw new Error(body.error || `Request failed with status ${response.status}.`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

const createRemoteTrip = (input: TripInput) => request<Trip>('/api/trips', {
  method: 'POST',
  body: JSON.stringify(input),
})

const tripToInput = (trip: Trip): TripInput => ({
  tripDate: trip.tripDate, truckPlateNumber: trip.truckPlateNumber, driverName: trip.driverName,
  helperName: trip.helperName, destination: trip.destination, customerName: trip.customerName,
  revenue: trip.revenue, driverRate: trip.driverRate, helperRate: trip.helperRate,
  gasExpense: trip.gasExpense, parkingExpense: trip.parkingExpense, tollExpense: trip.tollExpense,
  foodExpense: trip.foodExpense, otherExpense: trip.otherExpense, remarks: trip.remarks,
})

export const storageService = {
  async getTrips(): Promise<Trip[]> {
    let trips = await request<Trip[]>('/api/trips')
    const legacyTrips = safeRead<Trip[]>(LEGACY_TRIPS_KEY, [])
    if (!trips.length && legacyTrips.length) {
      await Promise.all(legacyTrips.map((trip) => createRemoteTrip(tripToInput(trip))))
      localStorage.removeItem(LEGACY_TRIPS_KEY)
      trips = await request<Trip[]>('/api/trips')
    }
    return trips
  },

  async createTrip(input: TripInput): Promise<Trip[]> {
    await createRemoteTrip(input)
    return this.getTrips()
  },

  async updateTrip(id: string, input: TripInput): Promise<Trip[]> {
    await request<Trip>(`/api/trips/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    return this.getTrips()
  },

  async deleteTrip(id: string): Promise<Trip[]> {
    await request<void>(`/api/trips/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return this.getTrips()
  },

  getSearch(): string { return localStorage.getItem(SEARCH_KEY) ?? '' },
  saveSearch(search: string): void { localStorage.setItem(SEARCH_KEY, search) },
  getMonth(): string { return localStorage.getItem(MONTH_KEY) ?? '' },
  saveMonth(month: string): void { localStorage.setItem(MONTH_KEY, month) },
  getTheme(): 'light' | 'dark' { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light' },
  saveTheme(theme: 'light' | 'dark'): void { localStorage.setItem(THEME_KEY, theme) },
}
