import type { SavedTruck, SavedTruckInput } from '../types'

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

export const truckService = {
  getTrucks: () => request<SavedTruck[]>('/api/trucks'),
  createTruck: (input: SavedTruckInput) => request<SavedTruck>('/api/trucks', { method: 'POST', body: JSON.stringify(input) }),
  updateTruck: (id: string, input: SavedTruckInput) => request<SavedTruck>(`/api/trucks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteTruck: (id: string) => request<void>(`/api/trucks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
