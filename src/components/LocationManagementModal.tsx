import { MapPin, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PHILIPPINE_LOCATIONS } from '../data/philippineLocations'
import type { SavedLocation, SavedLocationInput } from '../types'
import { BarangaySelect } from './BarangaySelect'

interface Props {
  locations: SavedLocation[]
  onSave: (input: SavedLocationInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const emptyLocation = (): SavedLocationInput => ({
  name: '', provinceCode: '', province: '', cityCode: '', city: '', barangayCode: '', barangay: '', address: '',
})

const locationText = (location: SavedLocation) =>
  [location.address, location.barangay, location.city, location.province].filter(Boolean).join(', ')

export function LocationManagementModal({ locations, onSave, onDelete }: Props) {
  const [form, setForm] = useState<SavedLocationInput>(emptyLocation)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const localities = PHILIPPINE_LOCATIONS.find((province) => province.code === form.provinceCode)?.localities ?? []

  const reset = () => { setForm(emptyLocation()); setEditingId(undefined); setError('') }
  const edit = (location: SavedLocation) => {
    setForm({
      name: location.name, provinceCode: location.provinceCode, province: location.province,
      cityCode: location.cityCode, city: location.city, barangayCode: location.barangayCode,
      barangay: location.barangay, address: location.address,
    })
    setEditingId(location.id)
    setDeletingId(undefined)
    setError('')
  }
  const setProvince = (code: string) => {
    const province = PHILIPPINE_LOCATIONS.find((item) => item.code === code)
    setForm((current) => ({ ...current, provinceCode: code, province: province?.name ?? '', cityCode: '', city: '', barangayCode: '', barangay: '' }))
  }
  const setCity = (code: string) => {
    const city = localities.find((item) => item.code === code)
    setForm((current) => ({ ...current, cityCode: code, city: city?.name ?? '', barangayCode: '', barangay: '' }))
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.province || !form.city) { setError('Location name, province, and city are required.'); return }
    setSaving(true); setError('')
    try { await onSave(form, editingId); reset() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the location.') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return }
    setSaving(true); setError('')
    try { await onDelete(id); if (editingId === id) reset(); setDeletingId(undefined) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete the location.') }
    finally { setSaving(false) }
  }

  return <section className="management-page location-management-page" aria-labelledby="location-manager-title">
      <header className="management-page-heading"><div><span className="eyebrow">SAVED LOCATIONS</span><h1 id="location-manager-title">Location management</h1><p>Create reusable addresses for faster trip entry.</p></div></header>
      <div className="management-page-content">
        <form className="location-editor" onSubmit={submit} noValidate>
          <div className="location-editor-heading"><div><h3>{editingId ? 'Edit saved location' : 'Add saved location'}</h3><p>Trips copy these details and remain manually editable.</p></div>{editingId && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
          {error && <div className="location-manager-error" role="alert">{error}</div>}
          <div className="form-grid">
            <label className="field full"><span>Location name<b>*</b></span><input value={form.name} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Main Garage or P&G Hub" /></label>
            <label className="field"><span>Province / area<b>*</b></span><select value={form.provinceCode} onChange={(event) => setProvince(event.target.value)}><option value="">Select province</option>{PHILIPPINE_LOCATIONS.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select></label>
            <label className="field"><span>City / municipality<b>*</b></span><select value={form.cityCode} onChange={(event) => setCity(event.target.value)} disabled={!form.provinceCode}><option value="">{form.provinceCode ? 'Select city or municipality' : 'Select province first'}</option>{localities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></label>
            {form.cityCode ? <BarangaySelect key={form.cityCode} cityCode={form.cityCode} value={form.barangayCode} selectedName={form.barangay} onChange={(code, name) => setForm((current) => ({ ...current, barangayCode: code, barangay: name }))} /> : <label className="field"><span>Barangay <em>Optional</em></span><select disabled><option>Select city first</option></select></label>}
            <label className="field"><span>Exact address <em>Optional</em></span><input value={form.address} maxLength={250} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Block, street, building, or landmark" /></label>
          </div>
          <button className="primary-button location-save-button" disabled={saving}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add location'}</button>
        </form>

        <section className="saved-location-list" aria-label="Saved locations">
          <div className="saved-location-list-heading"><h3>Saved locations</h3><span>{locations.length}</span></div>
          {!locations.length && <div className="sub-trips-empty">No saved locations yet.</div>}
          {locations.map((location) => <article className="saved-location-card" key={location.id}>
            <span><MapPin size={17} /></span><div><strong>{location.name}</strong><p>{locationText(location)}</p></div>
            <div className="saved-location-actions"><button type="button" onClick={() => edit(location)} disabled={saving} aria-label={`Edit ${location.name}`}><Pencil size={15} /></button><button type="button" className={deletingId === location.id ? 'confirming' : ''} onClick={() => remove(location.id)} disabled={saving} aria-label={deletingId === location.id ? `Confirm deleting ${location.name}` : `Delete ${location.name}`}><Trash2 size={15} />{deletingId === location.id && <small>Confirm</small>}</button></div>
          </article>)}
        </section>
      </div>
  </section>
}
