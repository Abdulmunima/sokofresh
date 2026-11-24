# Build plan — Phase 1 supplier app

Work top to bottom. Each task is sized for one Claude Code session. Tick the box when its "Done when" is true and tests pass.

## M0 — Foundations

- [x] **0.0 Schema fixes.** `0002_fixes.sql`: balances, tenant-safe keys, staff permissions, verified phones, due dates, plan limits, consent. `pnpm test:db` runs 25 checks.

- [x] **0.1 Scaffold the app.** Next.js (App Router, TS strict, Tailwind, ESLint) with pnpm; add `next-intl` (en, sw), Vitest, Playwright (Pixel 5 viewport), Prettier. Fill in the Commands section of `CLAUDE.md`.
  *Done when:* `pnpm dev` shows a hello page in English and Swahili; lint, typecheck and a sample test pass.
- [x] **0.2 Supabase locally.** `supabase init`, keep `supabase/migrations/0001_init.sql`, add `supabase/seed.sql` with one demo supplier ("Mama Mboga Wholesale"), 3 staff, 15 products, 8 customers, 20 orders, some payments. Generate TS types.
  *Done when:* `supabase db reset` runs clean and the types file exists.
- [x] **0.3 App shell.** Mobile layout with four bottom tabs (Orders, Stock, Payments, More), language toggle, big-button UI kit (Button, ListItem, StatusChip, MoneyText, PhoneInput, BottomSheet, Toast with Undo).
  *Done when:* shell renders at 360px; Playwright screenshot test.
- [x] **0.4 PWA + offline basics.** Installable manifest, icons, service worker caching the shell and last-viewed Orders/Stock data.
  *Done when:* Lighthouse PWA installable; app opens offline showing cached data.
- [x] **0.5 Shared helpers.** `normalisePhoneKE` (`src/lib/phone.ts`), `formatKES` (`src/lib/money.ts`), `waLink(phone, text)` (`src/lib/whatsapp.ts`), Nairobi date helpers (`src/lib/nairobi.ts`), next delivery slots and cut-offs (`src/lib/delivery.ts`), with unit tests.

## M1 — Accounts (F1)

- [x] **1.1 Phone OTP login** (codes sent on WhatsApp instead of SMS, per product decision) with Supabase Auth (SMS provider configurable; use test OTPs locally). Profile created on first login. On sign-out, clear the service worker's saved pages (`caches`), because phones are shared. Call `claim_staff_invites()` after login.
- [x] **1.2 Onboarding wizard** (≤ 5 skippable steps): business name → business type → payment methods → delivery days → first 5 products. Creates supplier, membership (owner), trial subscription.
- [x] **1.3 Staff management.** Owner adds staff by phone + role; staff get access on first login with that phone. Role checks in UI and server actions.
  *Done when:* e2e: owner signs up, adds a staff member, staff logs in and sees Orders but not money totals.

## M2 — Stock (F2)

- [ ] **2.1 Product list** grouped by category, search, one-tap In stock / Low / Out toggle, inline price edit (≤ 2 taps).
- [ ] **2.2 Add/edit product** with unit picker, price, optional quantity and photo (compressed client-side, Supabase Storage).
- [ ] **2.3 Bulk add by pasting a list** ("Tomatoes, crate, 2500" per line) with a review screen. (Photo-of-price-list import is P1.)

## M3 — Orders (F4)

- [ ] **3.1 Orders inbox:** newest first, filter by status/day, status chips, swipe or tap to advance status, undo.
- [ ] **3.2 New order (staff):** pick/create customer → tap products → quantities → delivery date → save in < 1 minute. Source = phone / WhatsApp / walk-in.
- [ ] **3.3 Order detail:** edit quantities for short items (`qty_delivered`), totals update, cancel with reason.
- [ ] **3.4 Customer list** auto-built from orders; customer detail with orders and notes.

## M4 — Delivery + customer link (F3, F5)

- [ ] **4.1 Delivery settings:** days, windows, cut-off, zones with fee and minimum order.
- [ ] **4.2 Public order page** `/s/[slug]`: uses `get_public_catalog(slug)`; in-stock items, cart, next available slot, name/phone/location, shows the supplier's payment methods. No login. Under 3s on throttled 3G.
- [ ] **4.3 Place order safely:** a server route (service role, rate-limited, validated with zod) that upserts the customer by phone, recalculates prices server-side, and creates the order with `source = 'link'`.
- [ ] **4.4 Returning customer:** phone lookup restores details and "repeat last order".
- [ ] **4.5 Share kit:** link, QR code (downloadable PNG), and "Order on WhatsApp" button.

## M5 — Payments and credit (F6)

- [ ] **5.1 Payment methods settings** (cash, Till, Paybill + account format, Send Money, bank details) shown on the order page and in statements.
- [ ] **5.2 Customer payment terms:** upfront / on delivery / credit (7/14/30 days, optional limit); supplier default; due date set on each order.
- [ ] **5.3 Record payment** in ≤ 3 taps; allocate oldest-first with manual override; payment status updates via the DB trigger.
- [ ] **5.4 M-Pesa SMS paste parser** (code, amount, sender, time) with fixtures for real SMS formats in tests.
- [ ] **5.5 Credit screen** (owner/manager only): total owed, total overdue, ageing buckets per customer from `customer_balances`.
- [ ] **5.6 Credit-limit / overdue warning** when creating an order (warn, never block).
  *Done when:* unit tests prove balance = orders − payments for split and partial payments; e2e records a pasted M-Pesa payment against two orders.

## M6 — WhatsApp share buttons (F9 step 1)

- [ ] **6.1 Message templates (en/sw):** order confirmation, out for delivery, receipt, statement, payment reminder, today's price list.
- [ ] **6.2 Share buttons** on order detail, customer detail and Stock tab, using `waLink`; log to `message_log` with channel `whatsapp_link`.

## M7 — Subscription (F7)

- [ ] **7.1 Plans + trial** (30 days); banner with days left.
- [ ] **7.2 Daraja STK push** to SokoFresh's Paybill (sandbox first) via a Supabase edge function; callback handler is idempotent and stores raw payloads.
- [ ] **7.3 Renewal reminders, 7-day grace, read-only mode** (customer link shows "temporarily unavailable"; no data deleted).

## M8 — Pilot hardening

- [ ] **8.1 Optional Daraja C2B auto-detection** for a pilot supplier's Till/Paybill: register URL, confirmation handler, "To match" list, staff confirms each match.
- [ ] **8.2 Analytics events** for the PRD success metrics (orders/week, link share of orders, payments recorded by due date, onboarding time).
- [ ] **8.3 Usability pass** with real staff on a cheap Android phone; fix the top 10 issues.

## P1 — After launch

- [ ] F8 daily WhatsApp/SMS summary + Reports tab with CSV/PDF export
- [ ] F9 step 2: WhatsApp Cloud API automated messages + SMS fallback
- [ ] F10 customer insights: nightly `customer_metrics` job, flags, weekly digest
- [ ] Price-list photo import for bulk stock
