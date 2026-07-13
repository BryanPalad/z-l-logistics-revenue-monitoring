import { clearSessionCookie } from '../../../worker/auth'
import type { Env } from '../../../worker/trips'

export const onRequestPost: PagesFunction<Env> = async () => new Response(null, {
  status: 204,
  headers: { 'Set-Cookie': clearSessionCookie(), 'Cache-Control': 'no-store' },
})
