import type { SavedLocation, SavedLocationInput } from '../types'

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

export const locationService = {
  getLocations: () => request<SavedLocation[]>('/api/locations'),
  createLocation: (input: SavedLocationInput) => request<SavedLocation>('/api/locations', {
    method: 'POST', body: JSON.stringify(input),
  }),
  updateLocation: (id: string, input: SavedLocationInput) => request<SavedLocation>(`/api/locations/${encodeURIComponent(id)}`, {
    method: 'PUT', body: JSON.stringify(input),
  }),
  deleteLocation: (id: string) => request<void>(`/api/locations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
