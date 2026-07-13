import { authConfigurationError, createSessionCookie, verifyPinAttempt } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<{ pin?: unknown }>()
    const pin = typeof body.pin === 'string' ? body.pin : ''
    if (!/^\d{6}$/.test(pin)) return json({ error: 'Enter a valid six-digit PIN.' }, 400)

    const result = await verifyPinAttempt(request, env, pin)
    if (result.retryAfter) {
      return new Response(JSON.stringify({ error: 'Too many attempts. Please wait 15 minutes.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(result.retryAfter), 'Cache-Control': 'no-store' },
      })
    }
    if (!result.allowed) return json({ error: 'Incorrect PIN.' }, 401)

    return new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': await createSessionCookie(env), 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400)
    return authConfigurationError(error)
  }
}
