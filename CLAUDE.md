# SokoFresh (working name) — instructions for Claude Code

SokoFresh is a subscription app for Nairobi wholesale suppliers: stock list, orders, delivery days, payment and credit tracking, a public customer order link, and WhatsApp sharing. Phase 1 is the **supplier side only**.

- Product spec: `docs/PRD.md` (source of truth for what to build)
- Build order: `docs/BUILD_PLAN.md` (work through tasks in order; tick them off)
- Database: `supabase/migrations/` (start from `0001_init.sql`)

## Non-negotiables

1. **We never handle money.** SokoFresh records payments; customers pay suppliers directly (cash, M-Pesa, bank). The only payment SokoFresh initiates is the supplier's own subscription fee (STK push to our Paybill). Never add checkout, wallets, escrow or payouts.
2. **Simplicity for low-tech staff.** One main action per screen, big tap targets (min 48px), max four bottom tabs: Orders · Stock · Payments · More. Icons + words. Undo instead of "Are you sure?" dialogs. No jargon ("Paid", not "Reconciled").
3. **English and Swahili from day one.** No hard-coded user-facing strings; every string goes in `messages/en.json` and `messages/sw.json`. If unsure of a Swahili translation, add it and mark it with a `TODO(sw)` comment in the PR summary so a native speaker can check it.
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
- Language comes from the `NEXT_LOCALE` cookie (no `/en` or `/sw` in URLs). Use `getTranslations` in server components and `useTranslations` in client components.
- `0002_fixes.sql` changed the balance views: use `outstanding_kes`, `overdue_kes`, `credit_kes` and `net_balance_kes` from `customer_balances`. Due dates are set by a trigger from the customer's terms (credit counts from the delivery date). `created_by` defaults to the logged-in user.
- UI building blocks live in `src/components/ui` (Button, List/ListItem, Order/Payment/StockStatusChip, MoneyText, PhoneInput, BottomSheet, Toast via `useToast()`); screen chrome in `src/components/shell` (PageHeader, BottomTabs, EmptyState, LanguageSwitch). Use them rather than new one-offs. `/more/design` shows them all on a real phone.
- Signed-in screens live under `src/app/(app)/` and get the bottom tabs from its layout. The public order page will live outside that group.
- Screenshot baselines (`tests/e2e/__screenshots__`) are recorded on Linux; refresh with `pnpm test:e2e --update-snapshots=changed` after an intended visual change.
- Import table types from `@/lib/supabase/types` (`Row<"products">`, `ViewRow<"customer_balances">`, `Enum<"order_status">`).
