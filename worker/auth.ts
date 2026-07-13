import { json, type Env } from './trips'

const COOKIE_NAME = 'zl_session'
const SESSION_SECONDS = 7 * 24 * 60 * 60
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW_SECONDS = 15 * 60

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const sign = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))
}

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

const getCookie = (request: Request, name: string) => {
  const cookies = request.headers.get('Cookie') ?? ''
  for (const cookie of cookies.split(';')) {
    const [key, ...value] = cookie.trim().split('=')
    if (key === name) return value.join('=')
  }
  return null
}

const requireSecrets = (env: Env) => {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters.')
  }
  if (!env.APP_PIN || !/^\d{6}$/.test(env.APP_PIN)) {
    throw new Error('APP_PIN must be configured as exactly six digits.')
  }
}

const clientKey = async (request: Request, secret: string) => {
  const address = request.headers.get('CF-Connecting-IP') ?? 'local-client'
  return sign(`client:${address}`, secret)
}

export const isAuthenticated = async (request: Request, env: Env) => {
  requireSecrets(env)
  const token = getCookie(request, COOKIE_NAME)
  if (!token) return false
  const [expiresAt, signature] = token.split('.')
  if (!expiresAt || !signature || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false
  const expected = await sign(expiresAt, env.SESSION_SECRET!)
  return constantTimeEqual(signature, expected)
}

export const createSessionCookie = async (env: Env) => {
  requireSecrets(env)
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
  const signature = await sign(expiresAt, env.SESSION_SECRET!)
  return `${COOKIE_NAME}=${expiresAt}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`
}

export const clearSessionCookie = () =>
  `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`

export const verifyPinAttempt = async (request: Request, env: Env, pin: string) => {
  requireSecrets(env)
  const key = await clientKey(request, env.SESSION_SECRET!)
  const now = Math.floor(Date.now() / 1000)
  const attempt = await env.DB.prepare(
    'SELECT attempt_count, window_started_at FROM auth_attempts WHERE client_key = ?',
  ).bind(key).first<{ attempt_count: number; window_started_at: number }>()

  if (attempt && now - attempt.window_started_at < ATTEMPT_WINDOW_SECONDS && attempt.attempt_count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: ATTEMPT_WINDOW_SECONDS - (now - attempt.window_started_at) }
  }

  if (constantTimeEqual(pin, env.APP_PIN!)) {
    await env.DB.prepare('DELETE FROM auth_attempts WHERE client_key = ?').bind(key).run()
    return { allowed: true, retryAfter: 0 }
  }

  if (!attempt || now - attempt.window_started_at >= ATTEMPT_WINDOW_SECONDS) {
    await env.DB.prepare(
      `INSERT INTO auth_attempts (client_key, attempt_count, window_started_at) VALUES (?, 1, ?)
       ON CONFLICT(client_key) DO UPDATE SET attempt_count = 1, window_started_at = excluded.window_started_at`,
    ).bind(key, now).run()
  } else {
    await env.DB.prepare('UPDATE auth_attempts SET attempt_count = attempt_count + 1 WHERE client_key = ?').bind(key).run()
  }
  return { allowed: false, retryAfter: 0 }
}

export const authConfigurationError = (error: unknown) => {
  console.error(error)
  return json({ error: 'Authentication is not configured on the server.' }, 500)
}
