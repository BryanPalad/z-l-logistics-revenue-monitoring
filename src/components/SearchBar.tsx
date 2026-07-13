import { CalendarDays, Download, Printer, Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  month: string
  onMonthChange: (value: string) => void
  onExport: () => void
  onPrint: () => void
  resultCount: number
  disabled: boolean
}

export function SearchBar({ value, onChange, month, onMonthChange, onExport, onPrint, resultCount, disabled }: Props) {
  return (
    <div className="table-tools">
      <div className="search-wrap">
        <Search size={18} />
        <input
          aria-label="Search trips"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search driver, plate, route, customer..."
        />
        {value && <button className="clear-search" onClick={() => onChange('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      <label className="month-filter">
        <CalendarDays size={17} />
        <span className="sr-only">Filter by month</span>
        <input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} aria-label="Filter trips by month" />
        {month && <button type="button" onClick={() => onMonthChange('')} aria-label="Show all months"><X size={15} /></button>}
      </label>
      {value && <span className="result-count">{resultCount} {resultCount === 1 ? 'result' : 'results'}</span>}
      <div className="tool-actions">
        <button className="secondary-button" onClick={onPrint} disabled={disabled}><Printer size={17} /> Print</button>
        <button className="secondary-button" onClick={onExport} disabled={disabled}><Download size={17} /> Export CSV</button>
      </div>
    </div>
  )
}
