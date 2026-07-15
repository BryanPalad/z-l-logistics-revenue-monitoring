import { Fuel, Gauge, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { FuelLog, FuelLogInput, SavedTruck, Trip } from '../types'
import { formatDate, formatPeso } from '../utils/calculations'

interface Props {
  trucks: SavedTruck[]
  trips: Trip[]
  fuelLogs: FuelLog[]
  onSave: (input: FuelLogInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const localToday = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
const emptyFuelLog = (): FuelLogInput => ({ truckId: '', purchaseDate: localToday(), amount: 0, liters: 0, odometerKm: null, notes: '' })
const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat('en-PH', { maximumFractionDigits: digits }).format(value)

export function FuelMonitoringPanel({ trucks, trips, fuelLogs, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FuelLogInput>(emptyFuelLog)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pricePerLiter = form.liters > 0 ? form.amount / form.liters : 0

  const reset = () => { setForm(emptyFuelLog()); setEditingId(undefined); setDeletingId(undefined); setError('') }
  const edit = (log: FuelLog) => {
    setForm({ truckId: log.truckId, purchaseDate: log.purchaseDate, amount: log.amount, liters: log.liters, odometerKm: log.odometerKm, notes: log.notes })
    setEditingId(log.id); setDeletingId(undefined); setError('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.truckId) { setError('Select a truck for this fuel purchase.'); return }
    if (!form.purchaseDate) { setError('Fuel purchase date is required.'); return }
    if (!Number.isFinite(form.amount) || form.amount <= 0) { setError('Fuel amount must be greater than zero.'); return }
    if (!Number.isFinite(form.liters) || form.liters <= 0) { setError('Fuel liters must be greater than zero.'); return }
    if (form.odometerKm !== null && (!Number.isFinite(form.odometerKm) || form.odometerKm < 0)) { setError('Odometer reading cannot be negative.'); return }
    setSaving(true); setError('')
    try { await onSave(form, editingId); reset() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the fuel purchase.') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return }
    setSaving(true); setError('')
    try { await onDelete(id); if (editingId === id) reset(); setDeletingId(undefined) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete the fuel purchase.') }
    finally { setSaving(false) }
  }

  return <section className="fuel-monitoring-section" aria-labelledby="fuel-monitoring-title">
    <header className="fuel-monitoring-heading"><div><span><Fuel size={19} /></span><div><h2 id="fuel-monitoring-title">Gas consumption monitoring</h2><p>Compare expected truck efficiency with recorded routes and standalone fuel purchases.</p></div></div><small>Standalone purchases are included in Dashboard gas expenses.</small></header>

    <div className="fuel-truck-metrics">
      {trucks.map((truck) => {
        const truckTrips = trips.filter((trip) => trip.truckPlateNumber.trim().toLowerCase() === truck.plateNumber.trim().toLowerCase())
        const logs = fuelLogs.filter((log) => log.truckId === truck.id || log.truckPlateNumber.trim().toLowerCase() === truck.plateNumber.trim().toLowerCase())
        const routeKm = truckTrips.reduce((sum, trip) => sum + (trip.routeDistanceMeters ?? 0), 0) / 1000
        const estimatedLiters = routeKm / truck.fuelEfficiencyKmPerLiter
        const purchasedLiters = logs.reduce((sum, log) => sum + log.liters, 0)
        const standaloneCost = logs.reduce((sum, log) => sum + log.amount, 0)
        const tripGasCost = truckTrips.reduce((sum, trip) => sum + trip.gasExpense, 0)
        const observedEfficiency = purchasedLiters > 0 ? routeKm / purchasedLiters : null
        const fuelCostPerKm = routeKm > 0 ? (standaloneCost + tripGasCost) / routeKm : null
        return <article className="fuel-truck-card" key={truck.id}>
          <header><div><strong>{truck.brand} {truck.truckType}</strong><small>{truck.plateNumber}</small></div><span>{truck.fuelEfficiencyKmPerLiter} km/L standard</span></header>
          <div><span><small>Recorded route</small><strong>{formatNumber(routeKm)} km</strong></span><span><small>Estimated liters used</small><strong>{formatNumber(estimatedLiters, 2)} L</strong></span><span><small>Fuel purchased</small><strong>{formatNumber(purchasedLiters, 2)} L</strong></span><span><small>Observed efficiency*</small><strong>{observedEfficiency === null ? '—' : `${formatNumber(observedEfficiency, 2)} km/L`}</strong></span><span><small>Total fuel cost</small><strong>{formatPeso(standaloneCost + tripGasCost)}</strong></span><span><small>Fuel cost / km</small><strong>{fuelCostPerKm === null ? '—' : formatPeso(fuelCostPerKm)}</strong></span></div>
        </article>
      })}
      {!trucks.length && <div className="sub-trips-empty">Add a truck first to start monitoring fuel consumption.</div>}
    </div>
    {!!trucks.length && <p className="fuel-estimate-note">*Observed efficiency uses recorded route kilometers divided by purchased liters. Remaining fuel, missing routes, or fill-ups outside this system can affect the comparison.</p>}

    <div className="fuel-management-grid">
      <form className="fuel-log-editor" onSubmit={submit} noValidate>
        <div className="location-editor-heading"><div><h3>{editingId ? 'Edit fuel purchase' : 'Record fuel purchase'}</h3><p>Use this for pump gas that is not entered as a trip expense.</p></div>{editingId && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
        {error && <div className="location-manager-error" role="alert">{error}</div>}
        <div className="form-grid">
          <label className="field full"><span>Truck<b>*</b></span><select value={form.truckId} onChange={(event) => setForm((current) => ({ ...current, truckId: event.target.value }))} disabled={!trucks.length}><option value="">{trucks.length ? 'Select truck' : 'Add a truck first'}</option>{trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} — {truck.brand} {truck.truckType}</option>)}</select></label>
          <label className="field"><span>Purchase date<b>*</b></span><input type="date" value={form.purchaseDate} onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))} /></label>
          <label className="field"><span>Odometer <em>Optional</em></span><div className="unit-input"><Gauge size={16} /><input type="number" min="0" step="0.1" value={form.odometerKm ?? ''} onChange={(event) => setForm((current) => ({ ...current, odometerKm: event.target.value === '' ? null : Number(event.target.value) }))} placeholder="e.g. 125000" /><i>km</i></div></label>
          <label className="field"><span>Amount paid<b>*</b></span><div className="money-input"><i>₱</i><input type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value === '' ? 0 : Number(event.target.value) }))} placeholder="0.00" /></div></label>
          <label className="field"><span>Liters pumped<b>*</b></span><div className="unit-input"><Fuel size={16} /><input type="number" min="0.01" step="0.01" value={form.liters || ''} onChange={(event) => setForm((current) => ({ ...current, liters: event.target.value === '' ? 0 : Number(event.target.value) }))} placeholder="0.00" /><i>L</i></div></label>
          <label className="field full"><span>Notes <em>Optional</em></span><input value={form.notes} maxLength={250} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Fuel station, receipt number, or remarks" /></label>
        </div>
        <div className="fuel-price-preview"><span>Calculated pump price</span><strong>{pricePerLiter ? `${formatPeso(pricePerLiter)} / L` : '—'}</strong></div>
        <button className="primary-button location-save-button" disabled={saving || !trucks.length}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add fuel expense'}</button>
      </form>

      <section className="fuel-log-history" aria-label="Fuel purchase history">
        <header><div><h3>Fuel purchase history</h3><p>Standalone fill-ups across all trucks</p></div><span>{fuelLogs.length}</span></header>
        {!fuelLogs.length && <div className="sub-trips-empty">No standalone fuel purchases recorded yet.</div>}
        {fuelLogs.map((log) => <article key={log.id}>
          <span><Fuel size={16} /></span><div><div><strong>{log.truckPlateNumber}</strong><small>{formatDate(log.purchaseDate)}</small></div><p>{formatNumber(log.liters, 2)} L · {formatPeso(log.amount)} · {formatPeso(log.amount / log.liters)}/L{log.odometerKm !== null ? ` · ${formatNumber(log.odometerKm)} km` : ''}</p>{log.notes && <em>{log.notes}</em>}</div>
          <div className="saved-location-actions"><button type="button" onClick={() => edit(log)} disabled={saving || !log.truckId} aria-label={`Edit fuel purchase for ${log.truckPlateNumber}`}><Pencil size={15} /></button><button type="button" className={deletingId === log.id ? 'confirming' : ''} onClick={() => remove(log.id)} disabled={saving} aria-label={deletingId === log.id ? `Confirm deleting fuel purchase for ${log.truckPlateNumber}` : `Delete fuel purchase for ${log.truckPlateNumber}`}><Trash2 size={15} />{deletingId === log.id && <small>Confirm</small>}</button></div>
        </article>)}
      </section>
    </div>
  </section>
}
