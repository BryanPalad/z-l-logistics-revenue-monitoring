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

4. Apply the production migration:

   ```bash
   npm run cf:db:migrate:remote
   ```

5. Create a Cloudflare Pages project named `z-and-l-logistics-monitor`, connect the Git repository,
   and bind the D1 database as `DB` under Settings > Bindings.

6. Use `npm run build` as the build command and `dist` as the output directory.

## Local Cloudflare preview

Apply the local migration once:

```bash
npm run cf:db:migrate:local
```

Then run the Pages frontend, Functions, and local D1 database together:

```bash
npm run cf:dev
```

The standard `npm run dev` command only starts Vite and does not provide the `/api` Functions.

## Security

Before adding real records, protect the Pages domain with Cloudflare Access and allow only company
email addresses. Access runs before Pages Functions, so it protects both the frontend and `/api` routes.

## Existing browser data

If D1 is empty and this browser has trips saved by the earlier localStorage version, the app uploads
those trips once and then removes the old local trip storage. Search, month, and theme preferences remain local.
