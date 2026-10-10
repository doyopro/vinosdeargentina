// Automatic volume discounts shown on /packs. These mirror the code-less rows of
// the `promotions` table (the server in create-payment-intent-v2 is the source of
// truth for what is really applied). The table is not publicly readable (RLS), so
// if you change the tiers in the admin, update this list too.
// `from` is the cart subtotal before IGIC and before the discount.
export const AUTO_TIERS = [
  { from: 500, pct: 5 },
  { from: 1000, pct: 7.5 },
  { from: 2000, pct: 10 },
] as const;
