import { json, type Env } from '../../../worker/trips'

interface PsgcBarangay {
  code?: string
  name?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const cityCode = new URL(request.url).searchParams.get('cityCode')?.trim() ?? ''
  if (!/^\d{9}$/.test(cityCode)) return json({ error: 'A valid city or municipality code is required.' }, 400)

  try {
    const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${encodeURIComponent(cityCode)}/barangays/`)
    if (!response.ok) return json({ error: 'Barangays are temporarily unavailable.' }, 502)
    const values = await response.json() as PsgcBarangay[]
    const barangays = values
      .filter((item): item is Required<Pick<PsgcBarangay, 'code' | 'name'>> => typeof item.code === 'string' && typeof item.name === 'string')
      .map(({ code, name }) => ({ code, name }))
      .sort((left, right) => left.name.localeCompare(right.name))
    return Response.json(barangays, { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } })
  } catch (error) {
    console.error('PSGC barangay lookup failed:', error)
    return json({ error: 'Barangays are temporarily unavailable.' }, 502)
  }
}
