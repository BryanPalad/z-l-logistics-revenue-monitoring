import { Pencil, Plus, Save, Trash2, UserRound, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Personnel, PersonnelInput, PersonnelRole } from '../types'
import { formatPeso } from '../utils/calculations'

interface Props {
  personnel: Personnel[]
  onSave: (input: PersonnelInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const localToday = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
const emptyPerson = (): PersonnelInput => ({ role: 'driver', name: '', defaultRate: 0, startDate: localToday(), endDate: '', isActive: true })
const formatEmploymentDate = (date: string) => date ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) : 'Not recorded'

export function PersonnelManagementModal({ personnel, onSave, onDelete }: Props) {
  const [form, setForm] = useState<PersonnelInput>(emptyPerson)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => { setForm(emptyPerson()); setEditingId(undefined); setError('') }
  const edit = (person: Personnel) => {
    setForm({ role: person.role, name: person.name, defaultRate: person.defaultRate, startDate: person.startDate, endDate: person.endDate, isActive: person.isActive })
    setEditingId(person.id); setDeletingId(undefined); setError('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) { setError('Crew member name is required.'); return }
    if (!Number.isFinite(form.defaultRate) || form.defaultRate < 0 || form.role === 'driver' && form.defaultRate <= 0) {
      setError(form.role === 'driver' ? 'Driver default rate must be greater than zero.' : 'Helper default rate cannot be negative.'); return
    }
    if (!form.startDate) { setError('Employment start date is required.'); return }
    if (!form.isActive && !form.endDate) { setError('Enter an end date or mark the crew member as currently active.'); return }
    if (form.endDate && form.endDate < form.startDate) { setError('End date cannot be earlier than the start date.'); return }
    setSaving(true); setError('')
    try { await onSave(form, editingId); reset() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the crew member.') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return }
    setSaving(true); setError('')
    try { await onDelete(id); if (editingId === id) reset(); setDeletingId(undefined) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete the crew member.') }
    finally { setSaving(false) }
  }
  const count = (role: PersonnelRole) => personnel.filter((person) => person.role === role && person.isActive).length

  return <section className="management-page personnel-management-page" aria-labelledby="personnel-manager-title">
      <header className="management-page-heading"><div><span className="eyebrow">DRIVERS &amp; HELPERS</span><h1 id="personnel-manager-title">Crew management</h1><p>Save names and standard rates for faster trip entry.</p></div></header>
      <div className="management-page-content">
        <form className="location-editor" onSubmit={submit} noValidate>
          <div className="location-editor-heading"><div><h3>{editingId ? 'Edit crew member' : 'Add crew member'}</h3><p>The selected rate can still be changed on each trip.</p></div>{editingId && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
          {error && <div className="location-manager-error" role="alert">{error}</div>}
          <div className="form-grid">
            <label className="field"><span>Role<b>*</b></span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as PersonnelRole }))}><option value="driver">Driver</option><option value="helper">Helper</option></select></label>
            <label className="field"><span>Full name<b>*</b></span><input value={form.name} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Crew member name" /></label>
            <label className="field full"><span>Default {form.role} rate{form.role === 'driver' && <b>*</b>}</span><div className="money-input"><i>₱</i><input type="number" min="0" step="0.01" value={String(form.defaultRate)} onChange={(event) => setForm((current) => ({ ...current, defaultRate: event.target.value === '' ? 0 : Number(event.target.value) }))} /></div></label>
            <label className="field"><span>Employment start date<b>*</b></span><input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label className="employment-status-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked, endDate: event.target.checked ? '' : current.endDate }))} /><span><strong>Currently active</strong><small>Employment continues to Present</small></span></label>
            {!form.isActive && <label className="field full"><span>Employment end date<b>*</b></span><input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></label>}
          </div>
          <button className="primary-button location-save-button" disabled={saving}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add crew member'}</button>
        </form>

        <section className="saved-location-list" aria-label="Saved crew members">
          <div className="crew-counts"><span><UserRound size={14} /> {count('driver')} active drivers</span><span><UsersRound size={14} /> {count('helper')} active helpers</span></div>
          {!personnel.length && <div className="sub-trips-empty">No drivers or helpers saved yet.</div>}
          {personnel.map((person) => <article className="saved-location-card personnel-card" key={person.id}>
            <span>{person.role === 'driver' ? <UserRound size={17} /> : <UsersRound size={17} />}</span><div><div className="personnel-name"><strong>{person.name}</strong><small>{person.role}</small><small className={person.isActive ? 'active' : 'inactive'}>{person.isActive ? 'Active' : 'Inactive'}</small></div><p>{formatPeso(person.defaultRate)} · {formatEmploymentDate(person.startDate)} – {person.isActive ? 'Present' : formatEmploymentDate(person.endDate)}</p></div>
            <div className="saved-location-actions"><button type="button" onClick={() => edit(person)} disabled={saving} aria-label={`Edit ${person.name}`}><Pencil size={15} /></button><button type="button" className={deletingId === person.id ? 'confirming' : ''} onClick={() => remove(person.id)} disabled={saving} aria-label={deletingId === person.id ? `Confirm deleting ${person.name}` : `Delete ${person.name}`}><Trash2 size={15} />{deletingId === person.id && <small>Confirm</small>}</button></div>
          </article>)}
        </section>
      </div>
  </section>
}
