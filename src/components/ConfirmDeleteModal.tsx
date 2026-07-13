import { AlertTriangle, X } from 'lucide-react'
import type { Trip } from '../types'

interface Props { trip: Trip; onCancel: () => void; onConfirm: () => void }

export function ConfirmDeleteModal({ trip, onCancel, onConfirm }: Props) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <button className="icon-button close-button" onClick={onCancel} aria-label="Close"><X size={20} /></button>
        <div className="warning-icon"><AlertTriangle size={26} /></div>
        <h2 id="delete-title">Delete this trip?</h2>
        <p>Are you sure you want to delete this trip? The trip to <strong>{trip.destination}</strong> will be permanently removed.</p>
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="danger-button" onClick={onConfirm}>Delete trip</button>
        </div>
      </div>
    </div>
  )
}
