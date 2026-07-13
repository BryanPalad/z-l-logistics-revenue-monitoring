import { CalendarDays, Info, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { ModalMode, TripFormErrors, TripInput } from '../types'
import { formatPeso, getEstimatedProfit, getOtherExpenses, getTotalExpenses } from '../utils/calculations'

interface Props {
  mode: ModalMode
  initialData: TripInput
  onClose: () => void
  onSave: (data: TripInput) => void
  saving?: boolean
}

const requiredText: (keyof TripInput)[] = ['tripDate', 'truckPlateNumber', 'driverName', 'destination']
const requiredMoney: (keyof TripInput)[] = ['revenue', 'driverRate']
const moneyFields: (keyof TripInput)[] = [
  'revenue', 'driverRate', 'helperRate', 'gasExpense', 'parkingExpense', 'tollExpense', 'foodExpense', 'otherExpense',
]

const textLabels: Partial<Record<keyof TripInput, string>> = {
  tripDate: 'Trip date', truckPlateNumber: 'Truck plate number', driverName: 'Driver name', destination: 'Destination',
  revenue: 'Revenue', driverRate: 'Driver rate', helperRate: 'Helper rate', gasExpense: 'Gas expense',
}

export function TripModal({ mode, initialData, onClose, onSave, saving = false }: Props) {
  const [form, setForm] = useState<TripInput>(initialData)
  const [errors, setErrors] = useState<TripFormErrors>({})
  const otherExpenses = useMemo(() => getOtherExpenses(form), [form])
  const totalExpenses = useMemo(() => getTotalExpenses(form), [form])
  const profit = useMemo(() => getEstimatedProfit(form), [form])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [onClose])

  const setText = (field: keyof TripInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const setMoney = (field: keyof TripInput, value: string) => {
    const number = value === '' ? 0 : Number(value)
    setForm((current) => ({ ...current, [field]: number }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const validate = () => {
    const next: TripFormErrors = {}
    requiredText.forEach((field) => { if (!String(form[field]).trim()) next[field] = `${textLabels[field]} is required.` })
    requiredMoney.forEach((field) => { if (!Number.isFinite(form[field]) || Number(form[field]) <= 0) next[field] = `${textLabels[field]} must be greater than zero.` })
    moneyFields.forEach((field) => { if (Number(form[field]) < 0) next[field] = 'Amount cannot be negative.' })
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (validate()) onSave(form) }

  const moneyInput = (field: keyof TripInput, label: string, required = false) => (
    <label className="field">
      <span>{label}{required && <b>*</b>}</span>
      <div className={`money-input ${errors[field] ? 'invalid' : ''}`}><i>₱</i><input type="number" min="0" step="0.01" value={String(form[field])} onChange={(e) => setMoney(field, e.target.value)} /></div>
      {errors[field] && <small className="field-error">{errors[field]}</small>}
    </label>
  )

  return (
    <div className="modal-backdrop drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="trip-drawer" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">
        <header className="drawer-header">
          <div><span className="eyebrow">TRIP RECORD</span><h2 id="trip-modal-title">{mode === 'edit' ? 'Edit trip' : mode === 'duplicate' ? 'Duplicate trip' : 'Create new trip'}</h2><p>{mode === 'edit' ? 'Update the details for this logistics record.' : 'Add the trip details and expenses below.'}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={21} /></button>
        </header>
        <form onSubmit={submit} noValidate>
          <div className="drawer-content">
            <section className="form-section">
              <div className="section-heading"><span>01</span><div><h3>Trip information</h3><p>Basic delivery and personnel details</p></div></div>
              <div className="form-grid">
                <label className="field"><span>Trip date<b>*</b></span><div className={`date-input ${errors.tripDate ? 'invalid' : ''}`}><CalendarDays size={17} /><input type="date" value={form.tripDate} onChange={(e) => setText('tripDate', e.target.value)} /></div>{errors.tripDate && <small className="field-error">{errors.tripDate}</small>}</label>
                <label className="field"><span>Truck plate number<b>*</b></span><input className={errors.truckPlateNumber ? 'invalid' : ''} value={form.truckPlateNumber} onChange={(e) => setText('truckPlateNumber', e.target.value.toUpperCase())} placeholder="e.g. ABC 1234" />{errors.truckPlateNumber && <small className="field-error">{errors.truckPlateNumber}</small>}</label>
                <label className="field"><span>Driver name<b>*</b></span><input className={errors.driverName ? 'invalid' : ''} value={form.driverName} onChange={(e) => setText('driverName', e.target.value)} placeholder="Full name" />{errors.driverName && <small className="field-error">{errors.driverName}</small>}</label>
                <label className="field"><span>Helper name</span><input value={form.helperName} onChange={(e) => setText('helperName', e.target.value)} placeholder="Full name" /></label>
                <label className="field full"><span>Destination<b>*</b></span><input className={errors.destination ? 'invalid' : ''} value={form.destination} onChange={(e) => setText('destination', e.target.value)} placeholder="City or delivery address" />{errors.destination && <small className="field-error">{errors.destination}</small>}</label>
                <label className="field full"><span>Customer name <em>Optional</em></span><input value={form.customerName} onChange={(e) => setText('customerName', e.target.value)} placeholder="Company or customer" /></label>
              </div>
            </section>
            <section className="form-section">
              <div className="section-heading"><span>02</span><div><h3>Revenue & core costs</h3><p>Primary income and delivery expenses</p></div></div>
              <div className="form-grid money-grid">
                {moneyInput('revenue', 'Revenue from customer', true)}{moneyInput('driverRate', 'Driver rate', true)}
                {moneyInput('helperRate', 'Helper rate')}{moneyInput('gasExpense', 'Gas expense')}
              </div>
            </section>
            <section className="form-section">
              <div className="section-heading"><span>03</span><div><h3>Additional expenses</h3><p>Other costs incurred during the trip</p></div></div>
              <div className="form-grid money-grid">
                {moneyInput('parkingExpense', 'Parking expense')}{moneyInput('tollExpense', 'Toll expense')}
                {moneyInput('foodExpense', 'Food expense')}{moneyInput('otherExpense', 'Other expense')}
              </div>
            </section>
            <section className="calculation-panel">
              <div className="calculation-title"><div><Info size={16} /> Live calculation</div><span>Updates as you type</span></div>
              <div className="calculation-grid">
                <div><span>Other expenses</span><strong>{formatPeso(otherExpenses)}</strong></div>
                <div><span>Total expenses</span><strong>{formatPeso(totalExpenses)}</strong></div>
                <div className={`profit-total ${profit < 0 ? 'negative' : ''}`}><span>Estimated profit</span><strong>{formatPeso(profit)}</strong></div>
              </div>
            </section>
            <section className="form-section remarks-section">
              <label className="field"><span>Remarks</span><textarea rows={3} maxLength={500} value={form.remarks} onChange={(e) => setText('remarks', e.target.value)} placeholder="Add notes about this trip..." /><small className="char-count">{form.remarks.length}/500</small></label>
            </section>
          </div>
          <footer className="drawer-footer"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save trip'}</button></footer>
        </form>
      </aside>
    </div>
  )
}
