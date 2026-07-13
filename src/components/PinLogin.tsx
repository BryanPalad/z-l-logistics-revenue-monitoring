import { ArrowRight, Route, ShieldCheck } from 'lucide-react'
import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'

interface Props {
  onLogin: (pin: string) => Promise<void>
}

export function PinLogin({ onLogin }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const pin = digits.join('')

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '')
    setDigits(next)
    setError('')
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(pin)) { setError('Enter your six-digit access PIN.'); return }
    setSubmitting(true)
    setError('')
    try {
      await onLogin(pin)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.')
      setDigits(['', '', '', '', '', ''])
      window.requestAnimationFrame(() => inputRefs.current[0]?.focus())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><span><Route size={24} /></span><div><strong>Z&amp;L Palm Line Logistic</strong><small>OPERATIONS</small></div></div>
        <span className="eyebrow">PRIVATE ACCESS</span>
        <h1>Welcome back</h1>
        <p>Enter your six-digit PIN to open the logistics revenue dashboard.</p>
        <form onSubmit={submit}>
          <label id="access-pin-label">Access PIN</label>
          <div className="pin-inputs" onPaste={handlePaste} role="group" aria-labelledby="access-pin-label">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                autoFocus={index === 0}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                aria-label={`PIN digit ${index + 1}`}
                aria-invalid={!!error}
              />
            ))}
          </div>
          {error && <span className="login-error" role="alert">{error}</span>}
          <button className="primary-button" type="submit" disabled={submitting || pin.length !== 6}>
            {submitting ? 'Checking…' : <>Sign in <ArrowRight size={17} /></>}
          </button>
        </form>
        <div className="login-security"><ShieldCheck size={16} /><span>Protected with a secure, time-limited session</span></div>
      </section>
    </main>
  )
}
