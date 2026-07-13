import { CheckCircle2, X } from 'lucide-react'

interface Props {
  message: string
  onDismiss: () => void
}

export function SuccessToast({ message, onDismiss }: Props) {
  return (
    <div className="success-toast" role="status" aria-live="polite">
      <span><CheckCircle2 size={19} /></span>
      <p>{message}</p>
      <button onClick={onDismiss} aria-label="Dismiss notification"><X size={16} /></button>
    </div>
  )
}
