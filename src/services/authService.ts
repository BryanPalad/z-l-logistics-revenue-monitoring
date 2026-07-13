const readError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => ({ error: fallback })) as { error?: string }
  return body.error || fallback
}

export const authService = {
  async hasSession(): Promise<boolean> {
    const response = await fetch('/api/auth/session', { cache: 'no-store' })
    if (response.status === 401) return false
    if (!response.ok) throw new Error(await readError(response, 'Unable to check authentication.'))
    const contentType = response.headers.get('Content-Type') ?? ''
    if (!contentType.includes('application/json')) return false
    const body = await response.json().catch(() => null) as { authenticated?: unknown } | null
    return body?.authenticated === true
  },

  async login(pin: string): Promise<void> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (!response.ok) throw new Error(await readError(response, 'Unable to sign in.'))
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' })
  },
}
