import { Gauge, Pencil, Plus, Save, Trash2, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { FuelLog, FuelLogInput, SavedTruck, SavedTruckInput, Trip } from '../types'
import { FuelMonitoringPanel } from './FuelMonitoringPanel'

interface Props {
  trucks: SavedTruck[]
  trips: Trip[]
  fuelLogs: FuelLog[]
  onSave: (input: SavedTruckInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSaveFuelLog: (input: FuelLogInput, id?: string) => Promise<void>
  onDeleteFuelLog: (id: string) => Promise<void>
}

const emptyTruck = (): SavedTruckInput => ({ brand: '', truckType: '', plateNumber: '', color: '', fuelEfficiencyKmPerLiter: 0 })

export function TruckManagementModal({ trucks, trips, fuelLogs, onSave, onDelete, onSaveFuelLog, onDeleteFuelLog }: Props) {
  const [form, setForm] = useState<SavedTruckInput>(emptyTruck)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => { setForm(emptyTruck()); setEditingId(undefined); setError('') }
  const edit = (truck: SavedTruck) => {
    setForm({ brand: truck.brand, truckType: truck.truckType, plateNumber: truck.plateNumber, color: truck.color, fuelEfficiencyKmPerLiter: truck.fuelEfficiencyKmPerLiter })
    setEditingId(truck.id); setDeletingId(undefined); setError('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.brand.trim()) { setError('Truck manufacturer or brand is required.'); return }
    if (!form.truckType.trim()) { setError('Truck type is required.'); return }
    if (!form.plateNumber.trim()) { setError('Plate number is required.'); return }
    if (!form.color.trim()) { setError('Truck color is required.'); return }
    if (!Number.isFinite(form.fuelEfficiencyKmPerLiter) || form.fuelEfficiencyKmPerLiter <= 0 || form.fuelEfficiencyKmPerLiter > 100) {
      setError('Fuel efficiency must be greater than 0 and no more than 100 km/L.'); return
    }
    setSaving(true); setError('')
    try { await onSave(form, editingId); reset() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the truck.') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return }
    setSaving(true); setError('')
    try { await onDelete(id); if (editingId === id) reset(); setDeletingId(undefined) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete the truck.') }
    finally { setSaving(false) }
  }

  return <section className="management-page truck-management-page" aria-labelledby="truck-manager-title">
      <header className="management-page-heading"><div><span className="eyebrow">FLEET</span><h1 id="truck-manager-title">Truck management</h1><p>Save truck details for faster and consistent trip entry.</p></div></header>
      <div className="management-page-content">
        <form className="location-editor" onSubmit={submit} noValidate>
          <div className="location-editor-heading"><div><h3>{editingId ? 'Edit truck' : 'Add truck'}</h3><p>Selecting a saved truck will fill its plate number on a trip.</p></div>{editingId && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
          {error && <div className="location-manager-error" role="alert">{error}</div>}
          <div className="form-grid">
            <label className="field"><span>Manufacturer / brand<b>*</b></span><input value={form.brand} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} placeholder="e.g. Mitsubishi" /></label>
            <label className="field"><span>Truck type<b>*</b></span><input value={form.truckType} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, truckType: event.target.value }))} placeholder="e.g. 6-wheeler dropside" /></label>
            <label className="field"><span>Plate number<b>*</b></span><input value={form.plateNumber} maxLength={20} onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value.toUpperCase() }))} placeholder="e.g. ABC 1234" /></label>
            <label className="field"><span>Color<b>*</b></span><input value={form.color} maxLength={40} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder="e.g. White" /></label>
            <label className="field full"><span>Fuel efficiency<b>*</b></span><div className="unit-input"><Gauge size={16} /><input type="number" min="0.1" max="100" step="0.1" value={form.fuelEfficiencyKmPerLiter || ''} onChange={(event) => setForm((current) => ({ ...current, fuelEfficiencyKmPerLiter: event.target.value === '' ? 0 : Number(event.target.value) }))} placeholder="e.g. 8.5" /><i>km/L</i></div><small className="field-hint">Average kilometers traveled per liter of fuel.</small></label>
          </div>
          <button className="primary-button location-save-button" disabled={saving}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add truck'}</button>
        </form>

        <section className="saved-location-list" aria-label="Saved trucks">
          <div className="crew-counts"><span><Truck size={14} /> {trucks.length} saved {trucks.length === 1 ? 'truck' : 'trucks'}</span></div>
          {!trucks.length && <div className="sub-trips-empty">No trucks saved yet.</div>}
          {trucks.map((truck) => <article className="saved-location-card truck-card" key={truck.id}>
            <span><Truck size={17} /></span><div><div className="truck-name"><strong>{truck.brand} {truck.truckType}</strong><small>{truck.plateNumber}</small></div><p>{truck.color} · {truck.fuelEfficiencyKmPerLiter.toLocaleString(undefined, { maximumFractionDigits: 2 })} km/L</p></div>
            <div className="saved-location-actions"><button type="button" onClick={() => edit(truck)} disabled={saving} aria-label={`Edit ${truck.plateNumber}`}><Pencil size={15} /></button><button type="button" className={deletingId === truck.id ? 'confirming' : ''} onClick={() => remove(truck.id)} disabled={saving} aria-label={deletingId === truck.id ? `Confirm deleting ${truck.plateNumber}` : `Delete ${truck.plateNumber}`}><Trash2 size={15} />{deletingId === truck.id && <small>Confirm</small>}</button></div>
          </article>)}
        </section>
      </div>
      <FuelMonitoringPanel trucks={trucks} trips={trips} fuelLogs={fuelLogs} onSave={onSaveFuelLog} onDelete={onDeleteFuelLog} />
  </section>
}
