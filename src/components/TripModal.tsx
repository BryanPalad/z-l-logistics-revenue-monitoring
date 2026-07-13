import { CalendarDays, Info, MapPin, Navigation, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BarangaySelect } from './BarangaySelect'
import { PHILIPPINE_LOCATIONS } from '../data/philippineLocations'
import type { ModalMode, SubTripInput, TripFormErrors, TripInput } from '../types'
import { formatPeso, getAdditionalRevenue, getEstimatedProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props {
  mode: ModalMode
  initialData: TripInput
  onClose: () => void
  onSave: (data: TripInput) => void
  saving?: boolean
}

const requiredText: (keyof TripInput)[] = [
  'tripDate', 'truckPlateNumber', 'driverName',
  'originProvince', 'originCity', 'destinationProvince', 'destinationCity',
]
const requiredMoney: (keyof TripInput)[] = ['revenue', 'driverRate']
const moneyFields: (keyof TripInput)[] = [
  'revenue', 'driverRate', 'helperRate', 'gasExpense', 'parkingExpense', 'tollExpense', 'foodExpense', 'otherExpense',
]

const textLabels: Partial<Record<keyof TripInput, string>> = {
  tripDate: 'Trip date', truckPlateNumber: 'Truck plate number', driverName: 'Driver name',
  originProvince: 'From province', originCity: 'From city or municipality',
  destinationProvince: 'To province', destinationCity: 'To city or municipality',
  revenue: 'Revenue', driverRate: 'Driver rate', helperRate: 'Helper rate', gasExpense: 'Gas expense',
}

export function TripModal({ mode, initialData, onClose, onSave, saving = false }: Props) {
  const [form, setForm] = useState<TripInput>(initialData)
  const [errors, setErrors] = useState<TripFormErrors>({})
  const [subTripErrors, setSubTripErrors] = useState<Record<string, Partial<Record<'province' | 'city' | 'rate', string>>>>({})
  const additionalRevenue = useMemo(() => getAdditionalRevenue(form), [form])
  const totalRevenue = useMemo(() => getTotalRevenue(form), [form])
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
  const setProvince = (side: 'origin' | 'destination', code: string) => {
    const province = PHILIPPINE_LOCATIONS.find((item) => item.code === code)
    const provinceCodeField = side === 'origin' ? 'originProvinceCode' : 'destinationProvinceCode'
    const provinceField = side === 'origin' ? 'originProvince' : 'destinationProvince'
    const cityCodeField = side === 'origin' ? 'originCityCode' : 'destinationCityCode'
    const cityField = side === 'origin' ? 'originCity' : 'destinationCity'
    const barangayCodeField = side === 'origin' ? 'originBarangayCode' : 'destinationBarangayCode'
    const barangayField = side === 'origin' ? 'originBarangay' : 'destinationBarangay'
    setForm((current) => ({
      ...current,
      [provinceCodeField]: province?.code ?? '', [provinceField]: province?.name ?? '',
      [cityCodeField]: '', [cityField]: '',
      [barangayCodeField]: '', [barangayField]: '',
    }))
    setErrors((current) => ({ ...current, [provinceField]: undefined, [cityField]: undefined }))
  }
  const setCity = (side: 'origin' | 'destination', code: string) => {
    const provinceCode = side === 'origin' ? form.originProvinceCode : form.destinationProvinceCode
    const locality = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities.find((item) => item.code === code)
    const cityCodeField = side === 'origin' ? 'originCityCode' : 'destinationCityCode'
    const cityField = side === 'origin' ? 'originCity' : 'destinationCity'
    const barangayCodeField = side === 'origin' ? 'originBarangayCode' : 'destinationBarangayCode'
    const barangayField = side === 'origin' ? 'originBarangay' : 'destinationBarangay'
    setForm((current) => ({
      ...current, [cityCodeField]: locality?.code ?? '', [cityField]: locality?.name ?? '',
      [barangayCodeField]: '', [barangayField]: '',
    }))
    if (errors[cityField]) setErrors((current) => ({ ...current, [cityField]: undefined }))
  }
  const addSubTrip = () => {
    const subTrip: SubTripInput = {
      id: crypto.randomUUID(), destinationProvinceCode: '', destinationProvince: '',
      destinationCityCode: '', destinationCity: '', destinationBarangayCode: '', destinationBarangay: '',
      destinationAddress: '', customerRate: 0,
    }
    setForm((current) => ({ ...current, subTrips: [...current.subTrips, subTrip] }))
  }
  const updateSubTrip = (id: string, patch: Partial<SubTripInput>) => {
    setForm((current) => ({ ...current, subTrips: current.subTrips.map((subTrip) => subTrip.id === id ? { ...subTrip, ...patch } : subTrip) }))
    setSubTripErrors((current) => ({ ...current, [id]: {} }))
  }
  const removeSubTrip = (id: string) => {
    setForm((current) => ({ ...current, subTrips: current.subTrips.filter((subTrip) => subTrip.id !== id) }))
    setSubTripErrors((current) => { const next = { ...current }; delete next[id]; return next })
  }
  const setSubTripProvince = (id: string, code: string) => {
    const province = PHILIPPINE_LOCATIONS.find((item) => item.code === code)
    updateSubTrip(id, {
      destinationProvinceCode: province?.code ?? '', destinationProvince: province?.name ?? '',
      destinationCityCode: '', destinationCity: '', destinationBarangayCode: '', destinationBarangay: '',
    })
  }
  const setSubTripCity = (id: string, provinceCode: string, code: string) => {
    const locality = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities.find((item) => item.code === code)
    updateSubTrip(id, {
      destinationCityCode: locality?.code ?? '', destinationCity: locality?.name ?? '',
      destinationBarangayCode: '', destinationBarangay: '',
    })
  }
  const validate = () => {
    const next: TripFormErrors = {}
    requiredText.forEach((field) => { if (!String(form[field]).trim()) next[field] = `${textLabels[field]} is required.` })
    requiredMoney.forEach((field) => { if (!Number.isFinite(form[field]) || Number(form[field]) <= 0) next[field] = `${textLabels[field]} must be greater than zero.` })
    moneyFields.forEach((field) => { if (Number(form[field]) < 0) next[field] = 'Amount cannot be negative.' })
    const nextSubTripErrors: typeof subTripErrors = {}
    form.subTrips.forEach((subTrip) => {
      const subErrors: (typeof nextSubTripErrors)[string] = {}
      if (!subTrip.destinationProvince) subErrors.province = 'Province is required.'
      if (!subTrip.destinationCity) subErrors.city = 'City or municipality is required.'
      if (!Number.isFinite(subTrip.customerRate) || subTrip.customerRate <= 0) subErrors.rate = 'Customer rate must be greater than zero.'
      if (Object.keys(subErrors).length) nextSubTripErrors[subTrip.id] = subErrors
    })
    setErrors(next)
    setSubTripErrors(nextSubTripErrors)
    return Object.keys(next).length === 0 && Object.keys(nextSubTripErrors).length === 0
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (validate()) onSave(form) }

  const moneyInput = (field: keyof TripInput, label: string, required = false) => (
    <label className="field">
      <span>{label}{required && <b>*</b>}</span>
      <div className={`money-input ${errors[field] ? 'invalid' : ''}`}><i>₱</i><input type="number" min="0" step="0.01" value={String(form[field])} onChange={(e) => setMoney(field, e.target.value)} /></div>
      {errors[field] && <small className="field-error">{errors[field]}</small>}
    </label>
  )

  const locationFields = (side: 'origin' | 'destination') => {
    const isOrigin = side === 'origin'
    const provinceCode = isOrigin ? form.originProvinceCode : form.destinationProvinceCode
    const cityCode = isOrigin ? form.originCityCode : form.destinationCityCode
    const barangayCode = isOrigin ? form.originBarangayCode : form.destinationBarangayCode
    const barangay = isOrigin ? form.originBarangay : form.destinationBarangay
    const address = isOrigin ? form.originAddress : form.destinationAddress
    const provinceError = isOrigin ? errors.originProvince : errors.destinationProvince
    const cityError = isOrigin ? errors.originCity : errors.destinationCity
    const localities = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities ?? []
    return (
      <div className="location-card">
        <div className="location-card-heading">
          <span>{isOrigin ? <Navigation size={16} /> : <MapPin size={16} />}</span>
          <div><strong>{isOrigin ? 'From' : 'To'}</strong><small>{isOrigin ? 'Pickup location' : 'Delivery location'}</small></div>
        </div>
        <div className="form-grid">
          <label className="field"><span>Province / area<b>*</b></span><select className={provinceError ? 'invalid' : ''} value={provinceCode} onChange={(event) => setProvince(side, event.target.value)}><option value="">Select province</option>{PHILIPPINE_LOCATIONS.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select>{provinceError && <small className="field-error">{provinceError}</small>}</label>
          <label className="field"><span>City / municipality<b>*</b></span><select className={cityError ? 'invalid' : ''} value={cityCode} onChange={(event) => setCity(side, event.target.value)} disabled={!provinceCode}><option value="">{provinceCode ? 'Select city or municipality' : 'Select province first'}</option>{localities.map((locality) => <option key={locality.code} value={locality.code}>{locality.name}</option>)}</select>{cityError && <small className="field-error">{cityError}</small>}</label>
          {cityCode ? <BarangaySelect key={`${side}-${cityCode}`} cityCode={cityCode} value={barangayCode} selectedName={barangay} onChange={(code, name) => setForm((current) => ({ ...current, [isOrigin ? 'originBarangayCode' : 'destinationBarangayCode']: code, [isOrigin ? 'originBarangay' : 'destinationBarangay']: name }))} /> : <label className="field"><span>Barangay <em>Optional</em></span><select disabled><option>Select city first</option></select></label>}
          <label className="field"><span>Exact address <em>Optional</em></span><input value={address} onChange={(event) => setText(isOrigin ? 'originAddress' : 'destinationAddress', event.target.value)} placeholder="Block, lot, street, building, or landmark" /></label>
        </div>
      </div>
    )
  }

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
                <label className="field full"><span>Customer name <em>Optional</em></span><input value={form.customerName} onChange={(e) => setText('customerName', e.target.value)} placeholder="Company or customer" /></label>
              </div>
              <div className="route-fields">{locationFields('origin')}{locationFields('destination')}</div>
              <div className="sub-trips-block">
                <div className="sub-trips-heading"><div><h4>Additional routes</h4><p>Add another delivery made before returning home. Driver and helper rates are not repeated.</p></div><button type="button" className="secondary-button" onClick={addSubTrip} disabled={form.subTrips.length >= 20}><Plus size={15} /> Add route</button></div>
                {!form.subTrips.length && <div className="sub-trips-empty">No additional routes for this trip.</div>}
                {form.subTrips.map((subTrip, index) => {
                  const localities = PHILIPPINE_LOCATIONS.find((item) => item.code === subTrip.destinationProvinceCode)?.localities ?? []
                  const previousStop = index === 0 ? form.destinationCity : form.subTrips[index - 1].destinationCity
                  const subErrors = subTripErrors[subTrip.id] ?? {}
                  return (
                    <article className="sub-trip-card" key={subTrip.id}>
                      <div className="sub-trip-heading"><div><span>{index + 1}</span><div><strong>Additional route {index + 1}</strong><small>From {previousStop || 'the previous destination'}</small></div></div><button type="button" className="icon-button" onClick={() => removeSubTrip(subTrip.id)} aria-label={`Remove additional route ${index + 1}`}><Trash2 size={16} /></button></div>
                      <div className="form-grid">
                        <label className="field"><span>Destination province<b>*</b></span><select className={subErrors.province ? 'invalid' : ''} value={subTrip.destinationProvinceCode} onChange={(event) => setSubTripProvince(subTrip.id, event.target.value)}><option value="">Select province</option>{PHILIPPINE_LOCATIONS.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select>{subErrors.province && <small className="field-error">{subErrors.province}</small>}</label>
                        <label className="field"><span>Destination city / municipality<b>*</b></span><select className={subErrors.city ? 'invalid' : ''} value={subTrip.destinationCityCode} onChange={(event) => setSubTripCity(subTrip.id, subTrip.destinationProvinceCode, event.target.value)} disabled={!subTrip.destinationProvinceCode}><option value="">{subTrip.destinationProvinceCode ? 'Select city or municipality' : 'Select province first'}</option>{localities.map((locality) => <option key={locality.code} value={locality.code}>{locality.name}</option>)}</select>{subErrors.city && <small className="field-error">{subErrors.city}</small>}</label>
                        {subTrip.destinationCityCode ? <BarangaySelect key={`${subTrip.id}-${subTrip.destinationCityCode}`} cityCode={subTrip.destinationCityCode} value={subTrip.destinationBarangayCode} selectedName={subTrip.destinationBarangay} onChange={(code, name) => updateSubTrip(subTrip.id, { destinationBarangayCode: code, destinationBarangay: name })} /> : <label className="field"><span>Barangay <em>Optional</em></span><select disabled><option>Select city first</option></select></label>}
                        <label className="field"><span>Exact address <em>Optional</em></span><input value={subTrip.destinationAddress} onChange={(event) => updateSubTrip(subTrip.id, { destinationAddress: event.target.value })} placeholder="Block, street, building, or landmark" /></label>
                        <label className="field"><span>Customer rate / revenue<b>*</b></span><div className={`money-input ${subErrors.rate ? 'invalid' : ''}`}><i>₱</i><input type="number" min="0" step="0.01" value={String(subTrip.customerRate)} onChange={(event) => updateSubTrip(subTrip.id, { customerRate: event.target.value === '' ? 0 : Number(event.target.value) })} /></div>{subErrors.rate && <small className="field-error">{subErrors.rate}</small>}</label>
                      </div>
                    </article>
                  )
                })}
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
                <div><span>Additional revenue</span><strong>{formatPeso(additionalRevenue)}</strong></div>
                <div><span>Total revenue</span><strong>{formatPeso(totalRevenue)}</strong></div>
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
