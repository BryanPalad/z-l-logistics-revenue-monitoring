import { authConfigurationError, isAuthenticated } from '../../../worker/auth'
import { json, type Env } from '../../../worker/trips'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authenticated = await isAuthenticated(request, env)
    return json({ authenticated }, authenticated ? 200 : 401)
  } catch (error) {
    return authConfigurationError(error)
  }
}
