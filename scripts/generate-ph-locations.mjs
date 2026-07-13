import { readFile, writeFile } from 'node:fs/promises'

const [provincesPath, citiesPath, municipalitiesPath, outputPath] = process.argv.slice(2)
if (!outputPath) throw new Error('Usage: node scripts/generate-ph-locations.mjs provinces.json cities.json municipalities.json output.ts')

const [provinces, cities, municipalities] = await Promise.all(
  [provincesPath, citiesPath, municipalitiesPath].map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
)

const provinceByCode = new Map(provinces.map((province) => [province.code, province.name]))
const locations = new Map(provinces.map((province) => [province.name, { code: province.code, localities: [] }]))
locations.set('Metro Manila', { code: '130000000', localities: [] })
locations.set('Independent Cities', { code: 'independent', localities: [] })

for (const locality of [...cities, ...municipalities]) {
  let provinceName = provinceByCode.get(locality.provinceCode)
  if (!provinceName && locality.regionCode === '130000000') provinceName = 'Metro Manila'
  if (!provinceName) provinceName = 'Independent Cities'
  locations.get(provinceName).localities.push({ code: locality.code, name: locality.name })
}

const ordered = [...locations.entries()]
  .map(([name, value]) => ({ name, code: value.code, localities: value.localities.sort((a, b) => a.name.localeCompare(b.name)) }))
  .filter((province) => province.localities.length || province.name !== 'Independent Cities')
  .sort((a, b) => a.name.localeCompare(b.name))

const source = `// Generated from the Philippine Standard Geographic Code location dataset.\n` +
  `// Regenerate with scripts/generate-ph-locations.mjs when the PSGC list is updated.\n` +
  `export interface PhilippineLocality { code: string; name: string }\n` +
  `export interface PhilippineProvince { code: string; name: string; localities: PhilippineLocality[] }\n\n` +
  `export const PHILIPPINE_LOCATIONS: PhilippineProvince[] = ${JSON.stringify(ordered)}\n`

await writeFile(outputPath, source)
