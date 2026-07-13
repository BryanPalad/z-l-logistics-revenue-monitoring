import { CalendarDays, Clock3, Flag, Info, MapPin, Navigation, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BarangaySelect } from './BarangaySelect'
import { PHILIPPINE_LOCATIONS } from '../data/philippineLocations'
import type { DropOffInput, ModalMode, TripFormErrors, TripInput } from '../types'
import { formatPeso, getEstimatedProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props {
  mode: ModalMode
  initialData: TripInput
  onClose: () => void
  onSave: (data: TripInput) => void
  saving?: boolean
}

const requiredText: (keyof TripInput)[] = [
  'tripDate', 'truckPlateNumber', 'driverName',
  'homeProvince', 'homeCity', 'endingProvince', 'endingCity',
  'originProvince', 'originCity', 'destinationProvince', 'destinationCity',
]
const requiredMoney: (keyof TripInput)[] = ['revenue', 'driverRate']
const moneyFields: (keyof TripInput)[] = [
  'revenue', 'driverRate', 'helperRate', 'gasExpense', 'parkingExpense', 'tollExpense', 'foodExpense', 'otherExpense',
]

const textLabels: Partial<Record<keyof TripInput, string>> = {
  tripDate: 'Trip date', truckPlateNumber: 'Truck plate number', driverName: 'Driver name',
  homeProvince: 'Starting province', homeCity: 'Starting city or municipality',
  endingProvince: 'Ending province', endingCity: 'Ending city or municipality',
  originProvince: 'From province', originCity: 'From city or municipality',
  destinationProvince: 'To province', destinationCity: 'To city or municipality',
  revenue: 'Revenue', driverRate: 'Driver rate', helperRate: 'Helper rate', gasExpense: 'Gas expense',
}

type LocationSide = 'home' | 'origin' | 'destination' | 'ending'

const locationFieldNames = {
  home: {
    provinceCode: 'homeProvinceCode', province: 'homeProvince', cityCode: 'homeCityCode', city: 'homeCity',
    barangayCode: 'homeBarangayCode', barangay: 'homeBarangay', address: 'homeAddress',
  },
  ending: {
    provinceCode: 'endingProvinceCode', province: 'endingProvince', cityCode: 'endingCityCode', city: 'endingCity',
    barangayCode: 'endingBarangayCode', barangay: 'endingBarangay', address: 'endingAddress',
  },
  origin: {
    provinceCode: 'originProvinceCode', province: 'originProvince', cityCode: 'originCityCode', city: 'originCity',
    barangayCode: 'originBarangayCode', barangay: 'originBarangay', address: 'originAddress',
  },
  destination: {
    provinceCode: 'destinationProvinceCode', province: 'destinationProvince', cityCode: 'destinationCityCode', city: 'destinationCity',
    barangayCode: 'destinationBarangayCode', barangay: 'destinationBarangay', address: 'destinationAddress',
  },
} as const

export function TripModal({ mode, initialData, onClose, onSave, saving = false }: Props) {
  const [form, setForm] = useState<TripInput>(initialData)
  const [errors, setErrors] = useState<TripFormErrors>({})
  const [dropOffErrors, setDropOffErrors] = useState<Record<string, Partial<Record<'province' | 'city', string>>>>({})
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
  const setProvince = (side: LocationSide, code: string) => {
    const province = PHILIPPINE_LOCATIONS.find((item) => item.code === code)
    const fields = locationFieldNames[side]
    setForm((current) => ({
      ...current,
      [fields.provinceCode]: province?.code ?? '', [fields.province]: province?.name ?? '',
      [fields.cityCode]: '', [fields.city]: '', [fields.barangayCode]: '', [fields.barangay]: '',
    }))
    setErrors((current) => ({ ...current, [fields.province]: undefined, [fields.city]: undefined }))
  }
  const setCity = (side: LocationSide, code: string) => {
    const fields = locationFieldNames[side]
    const provinceCode = form[fields.provinceCode]
    const locality = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities.find((item) => item.code === code)
    setForm((current) => ({
      ...current, [fields.cityCode]: locality?.code ?? '', [fields.city]: locality?.name ?? '',
      [fields.barangayCode]: '', [fields.barangay]: '',
    }))
    if (errors[fields.city]) setErrors((current) => ({ ...current, [fields.city]: undefined }))
  }
  const addDropOff = () => {
    const dropOff: DropOffInput = {
      id: crypto.randomUUID(), destinationProvinceCode: '', destinationProvince: '',
      destinationCityCode: '', destinationCity: '', destinationBarangayCode: '', destinationBarangay: '',
      destinationAddress: '',
    }
    setForm((current) => ({ ...current, dropOffs: [...current.dropOffs, dropOff] }))
  }
  const updateDropOff = (id: string, patch: Partial<DropOffInput>) => {
    setForm((current) => ({ ...current, dropOffs: current.dropOffs.map((dropOff) => dropOff.id === id ? { ...dropOff, ...patch } : dropOff) }))
    setDropOffErrors((current) => ({ ...current, [id]: {} }))
  }
  const removeDropOff = (id: string) => {
    setForm((current) => ({ ...current, dropOffs: current.dropOffs.filter((dropOff) => dropOff.id !== id) }))
    setDropOffErrors((current) => { const next = { ...current }; delete next[id]; return next })
  }
  const setDropOffProvince = (id: string, code: string) => {
    const province = PHILIPPINE_LOCATIONS.find((item) => item.code === code)
    updateDropOff(id, {
      destinationProvinceCode: province?.code ?? '', destinationProvince: province?.name ?? '',
      destinationCityCode: '', destinationCity: '', destinationBarangayCode: '', destinationBarangay: '',
    })
  }
  const setDropOffCity = (id: string, provinceCode: string, code: string) => {
    const locality = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities.find((item) => item.code === code)
    updateDropOff(id, {
      destinationCityCode: locality?.code ?? '', destinationCity: locality?.name ?? '',
      destinationBarangayCode: '', destinationBarangay: '',
    })
  }
  const validate = () => {
    const next: TripFormErrors = {}
    requiredText.forEach((field) => { if (!String(form[field]).trim()) next[field] = `${textLabels[field]} is required.` })
    requiredMoney.forEach((field) => { if (!Number.isFinite(form[field]) || Number(form[field]) <= 0) next[field] = `${textLabels[field]} must be greater than zero.` })
    moneyFields.forEach((field) => { if (Number(form[field]) < 0) next[field] = 'Amount cannot be negative.' })
    if (form.driverStartTime && !form.driverEndTime) next.driverEndTime = 'Enter the driver end time.'
    if (form.driverEndTime && !form.driverStartTime) next.driverStartTime = 'Enter the driver start time.'
    const nextDropOffErrors: typeof dropOffErrors = {}
    form.dropOffs.forEach((dropOff) => {
      const stopErrors: (typeof nextDropOffErrors)[string] = {}
      if (!dropOff.destinationProvince) stopErrors.province = 'Province is required.'
      if (!dropOff.destinationCity) stopErrors.city = 'City or municipality is required.'
      if (Object.keys(stopErrors).length) nextDropOffErrors[dropOff.id] = stopErrors
    })
    setErrors(next)
    setDropOffErrors(nextDropOffErrors)
    return Object.keys(next).length === 0 && Object.keys(nextDropOffErrors).length === 0
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (validate()) onSave(form) }

  const moneyInput = (field: keyof TripInput, label: string, required = false) => (
    <label className="field">
      <span>{label}{required && <b>*</b>}</span>
      <div className={`money-input ${errors[field] ? 'invalid' : ''}`}><i>₱</i><input type="number" min="0" step="0.01" value={String(form[field])} onChange={(e) => setMoney(field, e.target.value)} /></div>
      {errors[field] && <small className="field-error">{errors[field]}</small>}
    </label>
  )

  const locationFields = (side: LocationSide) => {
    const fields = locationFieldNames[side]
    const provinceCode = form[fields.provinceCode]
    const cityCode = form[fields.cityCode]
    const barangayCode = form[fields.barangayCode]
    const barangay = form[fields.barangay]
    const address = form[fields.address]
    const provinceError = errors[fields.province]
    const cityError = errors[fields.city]
    const heading = side === 'home' ? 'Starting Location' : side === 'origin' ? 'Pick Up Location' : side === 'ending' ? 'Ending Location' : 'Drop-off 1'
    const description = side === 'home' ? 'Where the driver begins this trip' : side === 'origin' ? 'Warehouse or hub pickup point' : side === 'ending' ? 'Where the driver finishes this trip' : 'First delivery location'
    const localities = PHILIPPINE_LOCATIONS.find((item) => item.code === provinceCode)?.localities ?? []
    return (
      <div className="location-card">
        <div className="location-card-heading">
          <span>{side === 'home' ? <Navigation size={16} /> : side === 'ending' ? <Flag size={16} /> : <MapPin size={16} />}</span>
          <div><strong>{heading}</strong><small>{description}</small></div>
        </div>
        <div className="form-grid">
          <label className="field"><span>Province / area<b>*</b></span><select className={provinceError ? 'invalid' : ''} value={provinceCode} onChange={(event) => setProvince(side, event.target.value)}><option value="">Select province</option>{PHILIPPINE_LOCATIONS.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select>{provinceError && <small className="field-error">{provinceError}</small>}</label>
          <label className="field"><span>City / municipality<b>*</b></span><select className={cityError ? 'invalid' : ''} value={cityCode} onChange={(event) => setCity(side, event.target.value)} disabled={!provinceCode}><option value="">{provinceCode ? 'Select city or municipality' : 'Select province first'}</option>{localities.map((locality) => <option key={locality.code} value={locality.code}>{locality.name}</option>)}</select>{cityError && <small className="field-error">{cityError}</small>}</label>
          {cityCode ? <BarangaySelect key={`${side}-${cityCode}`} cityCode={cityCode} value={barangayCode} selectedName={barangay} onChange={(code, name) => setForm((current) => ({ ...current, [fields.barangayCode]: code, [fields.barangay]: name }))} /> : <label className="field"><span>Barangay <em>Optional</em></span><select disabled><option>Select city first</option></select></label>}
          <label className="field"><span>Exact address <em>Optional</em></span><input value={address} onChange={(event) => setText(fields.address, event.target.value)} placeholder="Block, lot, street, building, or landmark" /></label>
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
                <label className="field"><span>Driver start time <em>Optional</em></span><div className={`date-input ${errors.driverStartTime ? 'invalid' : ''}`}><Clock3 size={17} /><input type="time" value={form.driverStartTime} onChange={(e) => setText('driverStartTime', e.target.value)} /></div>{errors.driverStartTime && <small className="field-error">{errors.driverStartTime}</small>}</label>
                <label className="field"><span>Driver end time <em>Optional</em></span><div className={`date-input ${errors.driverEndTime ? 'invalid' : ''}`}><Clock3 size={17} /><input type="time" value={form.driverEndTime} onChange={(e) => setText('driverEndTime', e.target.value)} /></div>{errors.driverEndTime && <small className="field-error">{errors.driverEndTime}</small>}</label>
                <label className="field full"><span>Warehouse / Hub <em>Optional</em></span><input value={form.customerName} onChange={(e) => setText('customerName', e.target.value)} placeholder="Warehouse, hub, or company name" /></label>
              </div>
              <div className="route-fields">{locationFields('home')}{locationFields('origin')}{locationFields('destination')}</div>
              <div className="sub-trips-block">
                <div className="sub-trips-heading"><div><h4>Additional drop-offs</h4><p>Stops on the main delivery route. These do not add revenue.</p></div><button type="button" className="secondary-button" onClick={addDropOff} disabled={form.dropOffs.length >= 20}><Plus size={15} /> Add drop-off</button></div>
                {!form.dropOffs.length && <div className="sub-trips-empty">No additional drop-offs for this trip.</div>}
                {form.dropOffs.map((dropOff, index) => {
                  const localities = PHILIPPINE_LOCATIONS.find((item) => item.code === dropOff.destinationProvinceCode)?.localities ?? []
                  const previousStop = index === 0 ? form.destinationCity : form.dropOffs[index - 1].destinationCity
                  const stopErrors = dropOffErrors[dropOff.id] ?? {}
                  return (
                    <article className="sub-trip-card" key={dropOff.id}>
                      <div className="sub-trip-heading"><div><span>{index + 2}</span><div><strong>Drop-off {index + 2}</strong><small>After {previousStop || 'the previous drop-off'}</small></div></div><button type="button" className="icon-button" onClick={() => removeDropOff(dropOff.id)} aria-label={`Remove drop-off ${index + 2}`}><Trash2 size={16} /></button></div>
                      <div className="form-grid">
                        <label className="field"><span>Destination province<b>*</b></span><select className={stopErrors.province ? 'invalid' : ''} value={dropOff.destinationProvinceCode} onChange={(event) => setDropOffProvince(dropOff.id, event.target.value)}><option value="">Select province</option>{PHILIPPINE_LOCATIONS.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select>{stopErrors.province && <small className="field-error">{stopErrors.province}</small>}</label>
                        <label className="field"><span>Destination city / municipality<b>*</b></span><select className={stopErrors.city ? 'invalid' : ''} value={dropOff.destinationCityCode} onChange={(event) => setDropOffCity(dropOff.id, dropOff.destinationProvinceCode, event.target.value)} disabled={!dropOff.destinationProvinceCode}><option value="">{dropOff.destinationProvinceCode ? 'Select city or municipality' : 'Select province first'}</option>{localities.map((locality) => <option key={locality.code} value={locality.code}>{locality.name}</option>)}</select>{stopErrors.city && <small className="field-error">{stopErrors.city}</small>}</label>
                        {dropOff.destinationCityCode ? <BarangaySelect key={`${dropOff.id}-${dropOff.destinationCityCode}`} cityCode={dropOff.destinationCityCode} value={dropOff.destinationBarangayCode} selectedName={dropOff.destinationBarangay} onChange={(code, name) => updateDropOff(dropOff.id, { destinationBarangayCode: code, destinationBarangay: name })} /> : <label className="field"><span>Barangay <em>Optional</em></span><select disabled><option>Select city first</option></select></label>}
                        <label className="field"><span>Exact address <em>Optional</em></span><input value={dropOff.destinationAddress} onChange={(event) => updateDropOff(dropOff.id, { destinationAddress: event.target.value })} placeholder="Block, street, building, or landmark" /></label>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="route-fields">{locationFields('ending')}</div>
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
