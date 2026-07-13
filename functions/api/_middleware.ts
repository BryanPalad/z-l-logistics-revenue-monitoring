import { authConfigurationError, isAuthenticated } from '../../worker/auth'
import { json, type Env } from '../../worker/trips'

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const path = new URL(request.url).pathname
  if (path.startsWith('/api/auth/')) return next()
  try {
    if (!await isAuthenticated(request, env)) return json({ error: 'Authentication required.' }, 401)
    return next()
  } catch (error) {
    return authConfigurationError(error)
  }
}
