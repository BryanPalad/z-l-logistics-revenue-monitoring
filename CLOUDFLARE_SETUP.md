# Cloudflare deployment

This project uses Cloudflare Pages Functions for its API and Cloudflare D1 for trip storage.

## First-time setup

1. Authenticate Wrangler:

   ```bash
   npx wrangler login
   ```

2. Create the database:

   ```bash
   npm run cf:db:create
   ```

3. Copy the returned `database_id` into `wrangler.toml`.

4. Apply all production migrations:

   ```bash
   npm run cf:db:migrate:remote
   ```

5. Create a Cloudflare Pages project named `z-l-logistics-revenue-monitoring`, connect the Git repository,
   and bind the D1 database as `DB` under Settings > Bindings.

6. Use `npm run build` as the build command and `dist` as the output directory.

7. In the Pages project, open **Settings > Variables and Secrets** and add these encrypted secrets:

   - `APP_PIN`: the exact six-digit PIN used to enter the app
   - `SESSION_SECRET`: a random value containing at least 32 characters
   - `GEOAPIFY_API_KEY`: the API key from a Geoapify project, used for route distance, drive time, and maps

   Generate a session secret locally with `openssl rand -hex 32`. Add all values to the Production
   environment and to Preview too if preview deployments should be usable. Never add these secrets to
   `wrangler.toml` or commit it to GitHub.

8. Redeploy after adding or changing the secrets.

## Local Cloudflare preview

Apply the local migration once:

```bash
npm run cf:db:migrate:local
```

Copy `.dev.vars.example` to `.dev.vars`, then replace the sample PIN and session secret with local values.
The `.dev.vars` file is ignored by Git.

To enable local route estimates, also add your Geoapify key as `GEOAPIFY_API_KEY` in `.dev.vars`.

Then run the Pages frontend, Functions, and local D1 database together:

```bash
npm run dev
```

This starts the complete local application with Pages Functions, PIN authentication, and D1 at
`http://localhost:8790`. The optional `npm run dev:vite` command only runs the frontend
on port 5173, so login and database requests are unavailable in that mode.

## PIN security

The dashboard and all trip API routes require the shared six-digit PIN. The PIN page is shown whenever
there is no valid session. A successful sign-in creates a secure HTTP-only session lasting seven days.
Five incorrect attempts from one address trigger a
15-minute lockout. There is no registration flow.

A shared PIN is intentionally simpler than individual user accounts. For stronger identity-based access
later, Cloudflare Access can be enabled in front of the site without removing this PIN gate.

## Route estimates and maps

Create a free Geoapify account and API key, then add it as the encrypted `GEOAPIFY_API_KEY` secret in
Cloudflare Pages. The key is used only by Pages Functions and is never sent to the frontend. A trip's
ordered route is its From location, main To location, then any additional routes. The driving distance,
estimated duration, and route geometry are calculated when the trip is saved and cached in D1.

Existing trips get a route estimate the next time they are edited and saved. If Geoapify is not configured
or cannot locate an address, the trip still saves normally and its route estimate remains unavailable.
Exact street or block addresses improve the result, but city and province are sufficient for a city-level estimate.

## Existing browser data

If D1 is empty and this browser has trips saved by the earlier localStorage version, the app uploads
those trips once and then removes the old local trip storage. Search, month, and theme preferences remain local.
