import { Banknote, ChartNoAxesCombined, CircleDollarSign, Truck } from 'lucide-react'
import { useState } from 'react'
import type { Trip } from '../types'
import { formatPeso, getEstimatedProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'

interface Props { trips: Trip[] }

export function SummaryCards({ trips }: Props) {
  const [expensesFlipped, setExpensesFlipped] = useState(false)
  const revenue = trips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0)
  const expenses = trips.reduce((sum, trip) => sum + getTotalExpenses(trip), 0)
  const profit = trips.reduce((sum, trip) => sum + getEstimatedProfit(trip), 0)
  const driverAndHelper = trips.reduce((sum, trip) => sum + trip.driverRate + trip.helperRate, 0)
  const gas = trips.reduce((sum, trip) => sum + trip.gasExpense, 0)
  const toll = trips.reduce((sum, trip) => sum + trip.tollExpense, 0)
  const otherCosts = trips.reduce((sum, trip) => sum + trip.parkingExpense + trip.foodExpense + trip.otherExpense, 0)
  const cards = [
    { label: 'Total Trips', value: trips.length.toLocaleString(), icon: Truck, tone: 'blue', breakdown: undefined },
    { label: 'Total Revenue', value: formatPeso(revenue), icon: CircleDollarSign, tone: 'violet', breakdown: undefined },
    { label: 'Total Expenses', value: formatPeso(expenses), icon: Banknote, tone: 'orange', breakdown: [
      { label: 'Driver + helper', value: formatPeso(driverAndHelper) },
      { label: 'Gas', value: formatPeso(gas) },
      { label: 'Toll', value: formatPeso(toll) },
      { label: 'Other costs', value: formatPeso(otherCosts) },
    ] },
    { label: 'Estimated Profit', value: formatPeso(profit), icon: ChartNoAxesCombined, tone: profit < 0 ? 'red' : 'green', breakdown: undefined },
  ]

  return (
    <section className="summary-grid" aria-label="Trip totals">
      {cards.map(({ label, value, icon: Icon, tone, breakdown }) => breakdown ? (
        <article
          className={`summary-card expense-flip-card ${expensesFlipped ? 'is-flipped' : ''}`}
          key={label}
          role="button"
          tabIndex={0}
          aria-pressed={expensesFlipped}
          aria-label={`${expensesFlipped ? 'Hide' : 'Show'} total expenses breakdown`}
          onClick={() => setExpensesFlipped((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setExpensesFlipped((current) => !current)
            }
          }}
        >
          <div className="expense-flip-inner">
            <div className="expense-flip-face expense-flip-front">
              <div className={`summary-icon ${tone}`}><Icon size={21} strokeWidth={2} /></div>
              <div className="summary-main"><p>{label}</p><strong>{value}</strong><span>View breakdown →</span></div>
            </div>
            <div className="expense-flip-face expense-flip-back">
              <div className="expense-breakdown-heading"><strong>Expense breakdown</strong><span>Click to return</span></div>
              <div className="expense-breakdown">
                {breakdown.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
              </div>
            </div>
          </div>
        </article>
      ) : (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${tone}`}><Icon size={21} strokeWidth={2} /></div>
          <div className="summary-main"><p>{label}</p><strong>{value}</strong></div>
        </article>
      ))}
    </section>
  )
}
