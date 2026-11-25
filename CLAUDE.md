# SokoFresh (working name) — instructions for Claude Code

SokoFresh is a subscription app for Nairobi wholesale suppliers: stock list, orders, delivery days, payment and credit tracking, a public customer order link, and WhatsApp sharing. Phase 1 is the **supplier side only**.

- Product spec: `docs/PRD.md` (source of truth for what to build)
- Build order: `docs/BUILD_PLAN.md` (work through tasks in order; tick them off)
- Database: `supabase/migrations/` (start from `0001_init.sql`)

## Non-negotiables

1. **We never handle money.** SokoFresh records payments; customers pay suppliers directly (cash, M-Pesa, bank). The only payment SokoFresh initiates is the supplier's own subscription fee (STK push to our Paybill). Never add checkout, wallets, escrow or payouts.
2. **Simplicity for low-tech staff.** One main action per screen, big tap targets (min 48px), max four bottom tabs: Orders · Stock · Payments · More. Icons + words. Undo instead of "Are you sure?" dialogs. No jargon ("Paid", not "Reconciled").
3. **English only (decision Nov 2026), plain everyday words.** No hard-coded user-facing strings: every string goes in `messages/en.json`, so another language can be added later without touching components. Do not add a language switch.
4. **Mobile-first, slow networks.** Design at 360px width first. Keep pages light; lazy-load images; the public order page must load in < 3s on 3G. Stock and order screens should keep working offline and sync later.
5. **Multi-tenant by `supplier_id`.** Every table carries `supplier_id` and is protected by row-level security. Never query without it. Never use the service-role key in browser code.
6. **Customer data stays private.** Customer names/phones/locations belong to the supplier. The public order page exposes only the supplier's catalogue, delivery windows and payment-method details.

## Conventions

- **Stack:** Next.js (App Router, TypeScript strict) + Tailwind, Supabase (Postgres, phone OTP auth, storage, edge functions), deployed on Vercel. i18n with `next-intl`. PWA via `@serwist/next`. Tests: Vitest (unit) + Playwright (key flows, mobile viewport).
- **Money:** KES as `numeric(12,2)` in Postgres; format with `Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })`. Never use floats for sums in SQL.
- **Phones:** store in E.164 (`+2547XXXXXXXX`); accept `07…`, `01…`, `2547…` input and normalise in one shared helper.
- **Time:** store UTC, display in `Africa/Nairobi`.
- **Derived money state** (balances, overdue) comes from the `order_balances` / `customer_balances` views, not duplicated columns.
- **WhatsApp (Phase 1):** use share links `https://wa.me/<digits>?text=<encodeURIComponent(msg)>` built by one helper; message templates live in the i18n files.
- **Roles:** owner, manager, staff. Staff can record payments but must not see money totals or the Credit screen (enforce in the UI and in server actions).
- Server mutations go through Server Actions or route handlers that check membership; keep business rules in `lib/` with unit tests.

## Workflow

- Pick the next unticked task in `docs/BUILD_PLAN.md`, plan briefly, implement, test, then tick it and summarise what changed.
- Keep PRs/commits small, one task each. Run `pnpm lint`, `pnpm typecheck` and `pnpm test` before calling a task done.
- When something in the PRD is ambiguous, choose the simplest option for a non-technical user, note the assumption in the task summary, and keep going.
- Add any new schema change as a new numbered migration; never edit an applied migration.

## Commands

- `pnpm dev` — run locally (http://localhost:3000)
- `pnpm build` / `pnpm start` — production build
- `pnpm lint` / `pnpm typecheck` / `pnpm format` (Prettier)
- `pnpm test` — unit tests (Vitest, `src/**/*.test.ts`)
- `pnpm test:e2e` — Playwright on a Pixel 5 viewport (`tests/e2e`); builds and starts the app itself
- `pnpm test:db` — applies every migration to a throwaway database on any Postgres 15+ and runs `supabase/tests/*.test.sql` (set `PGHOST`/`PGPORT`/`PGUSER`)
- `pnpm db:types` — regenerate `src/lib/supabase/database.types.ts` from the migrations (plain Postgres; add `-- --local` when local Supabase is running). Run after every migration.
- `pnpm exec supabase start` / `pnpm exec supabase db reset` — local Supabase with migrations + `supabase/seed.sql` (needs Docker)
- Demo logins (local, code `123456`): `0712000001` owner · `0712000002` manager · `0712000003` staff — supplier "Mama Mboga Wholesale", link `/s/mama-mboga-wholesale`

## Notes

- Next.js is version 16. Read `AGENTS.md` and the guides in `node_modules/next/dist/docs/` before using an API you are unsure of. Cache Components is **off** (see `next.config.ts`).
- Wording comes from `messages/en.json` via next-intl: `getTranslations` in server components, `useTranslations` in client components. The DB still has optional `name_sw` columns (products/categories); they only help search.
- `0002_fixes.sql` changed the balance views: use `outstanding_kes`, `overdue_kes`, `credit_kes` and `net_balance_kes` from `customer_balances`. Due dates are set by a trigger from the customer's terms (credit counts from the delivery date). `created_by` defaults to the logged-in user.
- UI building blocks live in `src/components/ui` (Button, List/ListItem, Order/Payment/StockStatusChip, MoneyText, PhoneInput, BottomSheet, Toast via `useToast()`); screen chrome in `src/components/shell` (PageHeader, BottomTabs, EmptyState, LanguageSwitch). Use them rather than new one-offs. `/more/design` shows them all on a real phone.
- Signed-in screens live under `src/app/(app)/` and get the bottom tabs from its layout. The public order page will live outside that group.
- Offline (task 0.4): the service worker is `src/app/sw.ts` (Serwist, built by `src/app/serwist/[path]/route.ts`, production only). Every page a user opens is saved (`PwaProvider`) and shown offline for 7 days with an amber banner; never-opened pages show `/offline`. Bottom tabs do full page loads when offline. Writes still need a connection — queue them when M2/M3 add offline edits. To test offline behaviour, use `pnpm build && pnpm start`; `pnpm dev` has no service worker.
- App icon source: `design/icon.svg` (placeholder until the brand is chosen); PNGs in `public/icons` and `src/app/{icon,apple-icon}.png`.
- Screenshot baselines (`tests/e2e/__screenshots__`) are recorded on Linux; refresh with `pnpm test:e2e --update-snapshots=changed` after an intended visual change.
- Shared helpers (use these, don't re-implement): `formatKES` (`lib/money`), `normalisePhoneKE` / `formatPhoneKE` (`lib/phone`), `waLink` (`lib/whatsapp`), `nairobiDate` / `nairobiInstant` / `daysOverdue` / `relativeDay` / `formatDay` / `formatTime` (`lib/nairobi`, dates are Nairobi `YYYY-MM-DD` strings like Postgres `date`), `nextDeliverySlots` / `isPastCutoff` (`lib/delivery`).
- **Login (task 1.1):** phone + 6-digit code sent on WhatsApp. Supabase Auth's Send SMS hook calls `src/app/api/auth/send-code/route.ts`, which sends a WhatsApp authentication template (`lib/whatsapp-cloud.ts`); without WhatsApp credentials the code is logged (dev only). The dev Supabase project points the hook at the Postgres function `send_login_code_dev` instead (codes land in `login_code_outbox`). `src/proxy.ts` refreshes the session and sends signed-out users to `/login` (public paths in `lib/auth/paths.ts`). Use `requireMember()` from `lib/auth/session.ts` in signed-in screens; `canSeeMoney(role)` for owner/manager-only money. Sign-out clears the offline caches.
- **Onboarding (task 1.2):** `/welcome` (step 1, name) calls the `create_business` RPC (0006: supplier + owner membership + 30-day Growth trial, unique slug). Steps 2–5 live at `/setup/{type,payments,delivery,products}` (owner/manager via `requireManager()`), rules in `lib/onboarding.ts`. E2E resets wizard test numbers (`+2547120001xx`) with the dev-only `dev_reset_test_user` (0007).
- **Staff (task 1.3):** `/more/staff` (owners manage, managers view; `lib/team.ts`). `add_team_member` (0008) adds an existing account at once or creates a named invite; `team_members()` is how members see each other's names/phones (profiles are private). Remove/role changes are plain membership updates with Undo.
- **Stock (task 2.1) and offline edits:** `/stock` lists products (`lib/stock.ts`). Every stock/price change is written to the phone's outbox first (`lib/outbox.ts`, localStorage), shown at once, then sent by server actions (`stock/actions.ts`, via `set_product_price` / `set_product_stock`, 0009) with the time it was made — the server ignores a change older than the one it has, so late or offline changes never overwrite newer ones; offline it waits ("Not sent yet") and is sent on reconnect, even after the app was closed. Reuse this pattern for other offline edits. Sign-out and the login screen clear saved data pages and the outbox (`lib/saved-pages.ts`), keeping the app's own files.
- **Database functions are locked by default (0004).** A new function is not callable by `anon`/`authenticated` until a migration grants it — grant only what the app calls.
- **Live test site:** https://sokofresh-five.vercel.app — Vercel project `sokofresh` (team `abdulmunima79-gmailcoms-projects`), deploys automatically on every push to `main`, functions in `dub1` (next to the Supabase project). Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sokofresh-dev). `NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing them.
- **Dev backend:** Supabase project `sokofresh-dev` (eu-west-1), URL/key in `.env.local` (see `.env.example`). E2E tests log in there for real (`tests/e2e/auth.setup.ts`, helpers in `tests/e2e/helpers.ts`): the dev project has a `dev_flags` row `login_code_lookup`, so tests can read the code sent to a demo number via `dev_latest_login_code` (0005). Never add that flag on production. Supabase allows one code per number per minute — give each login test its own demo number.
- Import table types from `@/lib/supabase/types` (`Row<"products">`, `ViewRow<"customer_balances">`, `Enum<"order_status">`).
