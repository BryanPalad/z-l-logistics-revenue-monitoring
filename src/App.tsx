import { LogOut, Moon, Plus, Route, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { PinLogin } from './components/PinLogin'
import { SearchBar } from './components/SearchBar'
import { SummaryCards } from './components/SummaryCards'
import { TripModal } from './components/TripModal'
import { TripTable } from './components/TripTable'
import { storageService } from './services/storageService'
import { authService } from './services/authService'
import type { ModalMode, Trip, TripInput } from './types'
import { exportTripsToCsv } from './utils/exportCsv'

const today = () => new Date().toISOString().slice(0, 10)
const emptyTrip = (): TripInput => ({
  tripDate: today(), truckPlateNumber: '', driverName: '', helperName: '', destination: '', customerName: '',
  revenue: 0, driverRate: 0, helperRate: 0, gasExpense: 0, parkingExpense: 0, tollExpense: 0,
  foodExpense: 0, otherExpense: 0, remarks: '',
})

function App() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [modal, setModal] = useState<{ mode: ModalMode; trip?: Trip } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSearch(storageService.getSearch())
      setMonth(storageService.getMonth())
      setTheme(storageService.getTheme())
      authService.hasSession()
        .then(async (hasSession) => {
          setAuthenticated(hasSession)
          if (hasSession) setTrips(await storageService.getTrips())
        })
        .catch((error: unknown) => setStorageError(error instanceof Error ? error.message : 'Unable to load trips.'))
        .finally(() => setLoading(false))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    const expireSession = () => { setAuthenticated(false); setTrips([]); setModal(null); setDeleteTarget(null) }
    window.addEventListener('auth-expired', expireSession)
    return () => window.removeEventListener('auth-expired', expireSession)
  }, [])

  const login = async (pin: string) => {
    await authService.login(pin)
    setTrips(await storageService.getTrips())
    setAuthenticated(true)
    setStorageError('')
  }
  const logout = async () => {
    await authService.logout()
    setAuthenticated(false)
    setTrips([])
    setModal(null)
    setDeleteTarget(null)
  }

  const updateSearch = (value: string) => { setSearch(value); storageService.saveSearch(value) }
  const updateMonth = (value: string) => { setMonth(value); storageService.saveMonth(value) }
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next); storageService.saveTheme(next)
  }
  const monthFilteredTrips = useMemo(() => [...trips]
    .filter((trip) => !month || trip.tripDate.startsWith(month))
    .sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.createdAt.localeCompare(a.createdAt)), [trips, month])
  const visibleTrips = useMemo(() => {
    const query = search.trim().toLowerCase()
    return monthFilteredTrips
      .filter((trip) => !query || [trip.driverName, trip.helperName, trip.truckPlateNumber, trip.destination, trip.customerName].some((value) => value.toLowerCase().includes(query)))
  }, [monthFilteredTrips, search])

  const saveTrip = async (input: TripInput) => {
    setSaving(true)
    setStorageError('')
    try {
      if (modal?.mode === 'edit' && modal.trip) setTrips(await storageService.updateTrip(modal.trip.id, input))
      else setTrips(await storageService.createTrip(input))
      setModal(null)
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to save the trip.')
    } finally {
      setSaving(false)
    }
  }
  const deleteTrip = async () => {
    if (!deleteTarget) return
    setStorageError('')
    try {
      setTrips(await storageService.deleteTrip(deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to delete the trip.')
    }
  }
  const initialData: TripInput = modal?.trip ? {
    tripDate: modal.trip.tripDate, truckPlateNumber: modal.trip.truckPlateNumber,
    driverName: modal.trip.driverName, helperName: modal.trip.helperName,
    destination: modal.trip.destination, customerName: modal.trip.customerName,
    revenue: modal.trip.revenue, driverRate: modal.trip.driverRate,
    helperRate: modal.trip.helperRate, gasExpense: modal.trip.gasExpense,
    parkingExpense: modal.trip.parkingExpense, tollExpense: modal.trip.tollExpense,
    foodExpense: modal.trip.foodExpense, otherExpense: modal.trip.otherExpense,
    remarks: modal.trip.remarks,
  } : emptyTrip()

  if (loading) return <div className="loading-state full-page"><div className="spinner" /><p>Preparing your secure dashboard...</p></div>
  if (!authenticated) return <PinLogin onLogin={login} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span><Route size={21} /></span><div><strong>Z&amp;L Palm Line Logistic</strong><small>OPERATIONS</small></div></a>
        <div className="topbar-actions"><span className="storage-status"><i /> Cloud database</span><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button><button className="secondary-button logout-button" onClick={logout}><LogOut size={16} /> Sign out</button></div>
      </header>
      <main id="top">
        <section className="page-heading">
          <div><span className="eyebrow">FINANCIAL OVERVIEW</span><h1>Logistics Revenue Monitoring</h1><p>Track every trip, control expenses, and know your margins.</p></div>
          <button className="primary-button new-trip" onClick={() => setModal({ mode: 'create' })}><Plus size={19} /> New Trip</button>
        </section>

        {storageError && <div className="error-banner" role="alert"><span>{storageError}</span><button onClick={() => setStorageError('')}>Dismiss</button></div>}

        <SummaryCards trips={monthFilteredTrips} />
        <section className="records-panel">
          <div className="records-heading"><div><h2>Trip records</h2><p>{monthFilteredTrips.length ? `${monthFilteredTrips.length} ${month ? 'trips in the selected month' : `saved ${monthFilteredTrips.length === 1 ? 'trip' : 'trips'} in your ledger`}` : month ? 'No trips in the selected month' : 'Your delivery ledger will appear here'}</p></div></div>
          <SearchBar value={search} onChange={updateSearch} month={month} onMonthChange={updateMonth} onExport={() => exportTripsToCsv(visibleTrips)} onPrint={() => window.print()} resultCount={visibleTrips.length} disabled={!visibleTrips.length} />
          <TripTable trips={visibleTrips} hasTrips={trips.length > 0} onNew={() => setModal({ mode: 'create' })} onEdit={(trip) => setModal({ mode: 'edit', trip })} onDuplicate={(trip) => setModal({ mode: 'duplicate', trip })} onDelete={setDeleteTarget} />
          {!!visibleTrips.length && <div className="table-footer">Showing <strong>{visibleTrips.length}</strong> of <strong>{monthFilteredTrips.length}</strong> trips</div>}
        </section>
      </main>
      <footer className="app-footer"><span>Z&amp;L Palm Line Logistic · Logistics monitoring</span><span>Securely stored in Cloudflare D1</span></footer>

      {modal && <TripModal mode={modal.mode} initialData={initialData} onClose={() => !saving && setModal(null)} onSave={saveTrip} saving={saving} />}
      {deleteTarget && <ConfirmDeleteModal trip={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteTrip} />}
    </div>
  )
}

export default App
