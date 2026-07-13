import { Banknote, ChartNoAxesCombined, CircleDollarSign, Truck } from 'lucide-react'
import type { Trip } from '../types'
import { formatPeso, getEstimatedProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props { trips: Trip[] }

export function SummaryCards({ trips }: Props) {
  const revenue = trips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0)
  const expenses = trips.reduce((sum, trip) => sum + getTotalExpenses(trip), 0)
  const profit = trips.reduce((sum, trip) => sum + getEstimatedProfit(trip), 0)
  const cards = [
    { label: 'Total Trips', value: trips.length.toLocaleString(), icon: Truck, tone: 'blue' },
    { label: 'Total Revenue', value: formatPeso(revenue), icon: CircleDollarSign, tone: 'violet' },
    { label: 'Total Expenses', value: formatPeso(expenses), icon: Banknote, tone: 'orange' },
    { label: 'Estimated Profit', value: formatPeso(profit), icon: ChartNoAxesCombined, tone: profit < 0 ? 'red' : 'green' },
  ]

  return (
    <section className="summary-grid" aria-label="Trip totals">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${tone}`}><Icon size={21} strokeWidth={2} /></div>
          <div><p>{label}</p><strong>{value}</strong></div>
        </article>
      ))}
    </section>
  )
}
