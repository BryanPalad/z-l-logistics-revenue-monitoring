export type PersonnelRole = 'driver' | 'helper'

export interface PersonnelInput {
  role: PersonnelRole
  name: string
  defaultRate: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface PersonnelRow {
  id: string
  role: PersonnelRole
  name: string
  default_rate_centavos: number
  start_date: string
  end_date: string
  is_active: number
  created_at: string
  updated_at: string
}

export const validatePersonnel = (value: unknown): PersonnelInput => {
  if (!value || typeof value !== 'object') throw new Error('Invalid crew member data.')
  const input = value as Record<string, unknown>
  const role = String(input.role ?? '')
  const name = String(input.name ?? '').trim()
  const defaultRate = Number(input.defaultRate)
  const startDate = String(input.startDate ?? '').trim()
  const isActive = input.isActive !== false
  const endDate = isActive ? '' : String(input.endDate ?? '').trim()
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
    && new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date
  if (role !== 'driver' && role !== 'helper') throw new Error('Select a valid crew role.')
  if (!name) throw new Error('Crew member name is required.')
  if (name.length > 80) throw new Error('Crew member name must be 80 characters or fewer.')
  if (!Number.isFinite(defaultRate) || defaultRate < 0) throw new Error('Default rate must be zero or greater.')
  if (role === 'driver' && defaultRate <= 0) throw new Error('A driver default rate must be greater than zero.')
  if (!validDate(startDate)) throw new Error('Enter a valid employment start date.')
  if (!isActive && !validDate(endDate)) throw new Error('Enter a valid employment end date, or mark the crew member as currently active.')
  if (endDate && endDate < startDate) throw new Error('Employment end date cannot be earlier than the start date.')
  return { role, name, defaultRate, startDate, endDate, isActive }
}

export const rowToPersonnel = (row: PersonnelRow) => ({
  id: row.id,
  role: row.role,
  name: row.name,
  defaultRate: row.default_rate_centavos / 100,
  startDate: row.start_date ?? '',
  endDate: row.end_date ?? '',
  isActive: row.is_active !== 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
