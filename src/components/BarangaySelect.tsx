import { useEffect, useState } from 'react'

export interface BarangayOption {
  code: string
  name: string
}

interface Props {
  cityCode: string
  value: string
  selectedName: string
  onChange: (code: string, name: string) => void
}

const cache = new Map<string, BarangayOption[]>()

export function BarangaySelect({ cityCode, value, selectedName, onChange }: Props) {
  const cached = cache.get(cityCode)
  const [barangays, setBarangays] = useState<BarangayOption[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (cached) return
    const controller = new AbortController()
    fetch(`/api/locations/barangays?cityCode=${encodeURIComponent(cityCode)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Barangays could not be loaded.')
        return response.json() as Promise<BarangayOption[]>
      })
      .then((values) => { cache.set(cityCode, values); setBarangays(values); setLoading(false) })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setFailed(true); setLoading(false)
      })
    return () => controller.abort()
  }, [cached, cityCode])

  const options = value && selectedName && !barangays.some((item) => item.code === value)
    ? [{ code: value, name: selectedName }, ...barangays]
    : barangays

  return (
    <label className="field">
      <span>Barangay <em>Optional</em></span>
      <select value={value} disabled={loading || failed} onChange={(event) => {
        const barangay = options.find((item) => item.code === event.target.value)
        onChange(barangay?.code ?? '', barangay?.name ?? '')
      }}>
        <option value="">{loading ? 'Loading barangays…' : failed ? 'Barangays unavailable' : 'Select barangay'}</option>
        {options.map((barangay) => <option key={barangay.code} value={barangay.code}>{barangay.name}</option>)}
      </select>
    </label>
  )
}
