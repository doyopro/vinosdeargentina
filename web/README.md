# De Altura Wines — storefront (Next.js)

Next.js port of the public storefront (catalog, checkout, confirmation) for De Altura Wines.
Admin (`admin.html`, served from `public/`) is intentionally out of scope for the Next.js
port — it stays static HTML until replaced by a separate Doyo OS module. `crm.html` was
removed; its CRM view is superseded by the `view-crm` section already in `admin.html`.

## Development

```bash
npm install
npm run dev
```

Requires `.env.local` with the Supabase and Stripe keys (see `.env.local` for the current values,
gitignored). The Stripe `create-payment-intent` Edge Function is not part of this project — it's
deployed separately in `supabase/functions/` at the repo root and is called as-is.

## Deploy

Auto-deployed by Vercel on every push (Root Directory: `web`). Pushes to
`feature/nextjs-migration` land as Preview deployments.
