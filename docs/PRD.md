# PRD: SokoFresh — Phase 1: Supplier App

> Working name only. "SokoFresh" is already used by a Nairobi agritech company (sokofresh.co.ke). Replace before branding.
> Live, editable version of this PRD: https://claude.ai/artifact/JHaTShmNd6jtt3iVH7LFsL (updated Nov 23, 2026)

## Overview and problem

SokoFresh Phase 1 is a simple, phone-first app that Nairobi suppliers pay a monthly subscription for. It lets them list their stock, set delivery days, take orders, and track who has paid and who owes. It works like a lightweight Choco for suppliers who have no website and no ordering system.

**How ordering works today.** Many Nairobi suppliers (produce, meat, dry goods, beverages, packaging) have no website. Customers order by phone call, WhatsApp message or by walking in. Stock lists live in someone's head, on paper, or in a WhatsApp status.

**The pain this causes:**

- **Orders get lost or misread.** They are spread across calls, WhatsApp chats and paper, so nothing is confirmed in writing.
- **Customers can't see what's available.** They call to ask what's in stock and what it costs, and staff answer the same questions all day.
- **Payment tracking is manual.** Payments come by M-Pesa (Till, Paybill, Send Money), cash or bank, and many customers buy on credit. Matching payments to orders is done by hand or not at all, so unpaid orders slip through.
- **Delivery timing is unclear.** Customers don't know cut-off times or which days the supplier delivers to their area.
- **Existing tools don't fit.** Ordering platforms and ERPs are built for tech-comfortable teams, cost too much, or don't handle M-Pesa well. Supplier staff often use basic Android phones and aren't comfortable with complex software.

**The opportunity.** Give suppliers one place to show stock, take orders and track payments and credit, simple enough for any staff member to use. Every supplier who signs up also adds to a supplier directory that can later become a customer-facing marketplace.

## Vision and roadmap

Start by making suppliers' daily work easier. Every supplier who joins becomes a listing in a directory, which later becomes a customer app that can be sold on its own.

| Phase | When | Scope | Gate to move on |
| --- | --- | --- | --- |
| 1 · Supplier app (this PRD) | Now · supplier pays | Stock, orders, delivery days, payment & credit tracking, customer order link, WhatsApp, subscription | 10 paying suppliers, ≥70% retained at month 3 |
| 2 · Customers | Next · free for customers | Customer app with saved orders, ordering from several suppliers, WhatsApp ordering, statements | Enough suppliers per category to browse |
| 3 · Directory | Later · sold to customers | Searchable supplier directory sold as its own app, paid featured listings, price and market insights | — |

## Users and personas

Phase 1 is designed for two people inside the supplier: the owner who pays, and the staff who use it every day. Customers only touch a simple order page.

| Persona | Who they are | What they need | Tech comfort |
| --- | --- | --- | --- |
| **Supplier owner** (buyer) | Runs a small or mid-size wholesale business, 2–20 staff | See orders and money at a glance, know who owes what, stop losing orders | Uses WhatsApp and M-Pesa daily; moderate |
| **Supplier staff** (daily user) | Counter, store or dispatch staff | Update stock, mark orders packed or delivered, record payments, without training | Low; often a shared or basic Android phone, may prefer Swahili |
| **Customer** (orders, doesn't pay us in Phase 1) | Restaurants, hotels, kiosks, shops, caterers | See what's available and the price, place an order, know when it arrives | Mixed; comfortable with WhatsApp and M-Pesa |

**Design for the staff member, not the owner.** If staff find it hard, they go back to WhatsApp and paper, and the owner cancels the subscription.

## Goals, non-goals and success metrics

Success in Phase 1 means 10 paying suppliers who use the app every day for orders and payments, six months after launch.

**Goals**

1. Suppliers can list stock and prices, and keep them up to date, in under a minute per change.
2. Every order lives in one place, wherever it came from (customer link, phone, WhatsApp, walk-in).
3. Every order has payment terms and a payment status, so the owner always knows who owes what, including customers on credit.
4. Customers get a shareable link that shows what's in stock and lets them order.
5. Suppliers pay a monthly subscription through M-Pesa.

**Non-goals for Phase 1**

- A customer-side app or marketplace for browsing many suppliers (Phase 2/3)
- Delivery logistics, driver tracking or route optimization
- Full accounting, invoicing to KRA eTIMS, or payroll (revisit later)
- Credit or financing for customers
- Processing, collecting or holding payments: SokoFresh only records them, and money goes straight from customer to supplier

**Success metrics**

| Metric | Target at 6 months |
| --- | --- |
| Paying suppliers | 10 |
| Supplier retention (month 3) | ≥ 70% |
| Orders logged per active supplier per week | ≥ 30 |
| Share of orders with a recorded payment by due date | ≥ 60% |
| Staff onboarding time (first order logged) | < 15 minutes, no manual |
| Share of orders placed via the customer link | ≥ 25% |

## Design principles

Simplicity is the product. Every screen should be usable by someone who has never had training and is using a cheap Android phone.

1. **One job per screen.** Big buttons, one main action, no menus several levels deep.
2. **Four tabs, maximum.** Orders · Stock · Payments · More.
3. **Pictures and words together.** Product photos and icons alongside labels, so staff with low literacy can still find things.
4. **English and Swahili.** Language toggle from day one. Use everyday words, e.g. "Paid" rather than "Reconciled".
5. **Feels like WhatsApp.** Familiar list-and-tap patterns. Order statuses are colored chips: New → Confirmed → Packed → Delivered.
6. **Phone number login.** One-time SMS or WhatsApp code. No email or passwords.
7. **Works on bad connections.** Light pages, offline-first stock and order screens that sync when back online, data-saving images.
8. **Undo instead of "Are you sure?".** Fewer blocking dialogs; mistakes are easy to reverse.
9. **Defaults over settings.** Sensible defaults for delivery days, units and currency (KES). Settings hidden under More.
10. **Notify where they already are.** Order and payment alerts by WhatsApp or SMS, not only in-app.

## MVP features

Priority: **P0** = must ship for launch, **P1** = ship within the first month after launch.

| # | Feature | Priority | Replaces today |
| --- | --- | --- | --- |
| F1 | Onboarding and staff accounts | P0 | Nothing (setup) |
| F2 | Stock list (catalogue) | P0 | Head, paper, WhatsApp status |
| F3 | Delivery schedule and cut-offs | P0 | Phone calls asking "when?" |
| F4 | Orders inbox | P0 | Calls, WhatsApp, paper |
| F5 | Customer order link | P0 | "What do you have today?" calls |
| F6 | Payment terms, credit and tracking | P0 | Notebooks, scrolling SMS, memory |
| F7 | Subscription billing | P0 | — |
| F8 | Daily summary and reports | P1 | End-of-day counting |
| F9 | WhatsApp integration | P0 share buttons, P1 automated | Copy-pasting messages by hand |
| F10 | Customer insights (who's slipping) | P1 | Noticing too late that a customer left |

### F1 — Onboarding and staff accounts

- As an **owner**, I sign up with my phone number and business name and can take my first order within 10 minutes.
- As an **owner**, I add staff by phone number and give each one a role: **Owner** (everything), **Manager** (everything except billing), or **Staff** (orders, stock, recording payments; no money totals or credit screen).
- As **staff**, I log in with a code sent to my phone. There is no password to remember.

*Acceptance:* setup takes 5 steps or fewer: name → business type → payment methods → delivery days → first 5 products, with the option to skip any step.

### F2 — Stock list

- As **staff**, I add a product with a name, photo (optional), unit (kg, crate, bag, piece, litre), and price in KES.
- As **staff**, I mark a product **In stock / Low / Out** with one tap. I can optionally track quantity.
- As an **owner**, I bulk-add products by pasting a list or uploading a photo of my price list. The list is pre-filled for me to check (P1).
- Products are grouped into simple categories (e.g. Vegetables, Meat, Dry goods).

*Acceptance:* a price or stock-status change takes ≤ 2 taps from the Stock tab and shows on the customer link at once.

### F3 — Delivery schedule and cut-offs

- As an **owner**, I set the days I deliver, the time windows (e.g. 6–10am), and an order cut-off (e.g. "order by 6pm for next morning").
- As an **owner**, I optionally set delivery zones (e.g. Westlands, CBD, Kilimani) with different days or a delivery fee, and a minimum order value.
- Customers see the next available delivery slot when they order.

### F4 — Orders inbox

- As **staff**, I see all orders in one list, newest first, with status chips: **New → Confirmed → Packed → Out for delivery → Delivered** (or **Cancelled**).
- As **staff**, I add an order received by phone, WhatsApp or walk-in in under a minute: pick the customer, tap products, set quantities.
- As **staff**, I can change quantities when an item is short (e.g. "only 8 of 10 crates") and the total updates.
- As an **owner**, I get a WhatsApp or SMS alert for each new order.
- The customer gets a WhatsApp or SMS message when the order is confirmed and when it's out for delivery.
- Each order shows its payment status: **Unpaid / Part-paid / Paid / Overdue**.
- A customer list (name, phone, location, notes) is built automatically from orders.

### F5 — Customer order link

- As an **owner**, I get a link and QR code (e.g. `<domain>/s/mama-mboga-wholesale`) to share on WhatsApp, Instagram or printed at the counter.
- As a **customer**, I open the link with no app and no sign-up. I see in-stock items with prices, add quantities, choose a delivery slot, and enter my name, phone and location.
- As a **customer**, I see how I'll pay based on my terms with this supplier (on delivery, upfront, or on account) and the supplier's payment details (Till, Paybill, bank). I pay the supplier directly. SokoFresh never takes the money.
- As a **customer**, I can send my order on WhatsApp instead: an "Order on WhatsApp" button opens a pre-filled message to the supplier.
- As a **returning customer**, my phone number brings back my details and lets me repeat my last order.

*Acceptance:* the page loads in under 3 seconds on 3G, and placing an order takes under 2 minutes.

### F6 — Payment terms, credit and tracking

**SokoFresh tracks payments; it never processes them.** Customers pay suppliers directly by cash, M-Pesa or bank transfer. The app records what was paid and shows what is outstanding.

- As an **owner**, I set the payment methods I accept, and their details are shown to customers: **Cash**, **M-Pesa Till**, **Paybill** (with account format), **Send Money** number, **Bank transfer** (bank, account name, number).
- As an **owner**, I set payment terms **per customer**: **Pay upfront**, **Pay on delivery**, or **Credit** (7 / 14 / 30 days, optional credit limit in KES). New customers get my default.
- Each order gets a due date from its customer's terms and a status: **Unpaid → Part-paid → Paid**, or **Overdue** once past due.
- As **staff**, I record a payment in 3 taps or fewer: amount, method, reference (M-Pesa code or bank ref). I can paste an M-Pesa SMS to fill these in. One payment can cover several orders; by default it pays off the oldest first.
- As an **owner**, I see a **Credit** screen: total owed, total overdue, and each customer's balance by age (current, 1–30, 31–60, 60+ days overdue).
- When a new order would take a customer over their credit limit or they have overdue invoices, staff see a warning. The order is not blocked; the owner decides.
- As an **owner**, I send a customer a statement or a polite reminder on WhatsApp, with the balance and my payment details.
- **Optional auto-detection:** suppliers with a Till or Paybill can connect it, so payments made to it appear automatically for staff to confirm against orders.

*Acceptance:* the owner sees total outstanding and total overdue on one screen; recording a payment takes ≤ 3 taps; customer balances always equal orders minus payments; no money ever passes through SokoFresh.

### F7 — Subscription billing

- As an **owner**, I start a free trial, then pay monthly by M-Pesa (STK push to SokoFresh's Paybill), with a reminder 3 days before renewal.
- If payment fails there is a 7-day grace period. After that the account goes **read-only**: data is kept and the customer link shows "temporarily unavailable". Nothing is deleted.

### F8 — Daily summary (P1)

- As an **owner**, I get an end-of-day WhatsApp or SMS summary: orders, revenue, amount paid vs unpaid, and top products.
- Simple Reports tab: sales by day or week, top customers, top products, and outstanding balances. Export to CSV or PDF.

### F9 — WhatsApp integration

Suppliers and customers already live on WhatsApp, so SokoFresh works through it rather than competing with it. It ships in two steps.

**Step 1 (P0, free): share buttons.** Buttons open the staff member's own WhatsApp (`https://wa.me/<phone>?text=<encoded>`) with a pre-filled message. There is no API, no Meta approval and no per-message cost.

- Share the order link or today's stock and prices list.
- Send an order confirmation, "out for delivery" message or receipt to a customer.
- Send a statement or payment reminder with the balance and payment details.
- Customers use "Order on WhatsApp" on the order link (F5).

**Step 2 (P1): automated messages** through the WhatsApp Business Platform (Cloud API):

- Automatic order confirmations and delivery updates to customers, and new-order alerts to owners and staff.
- Scheduled reminders for overdue balances, and the end-of-day summary (F8).
- Login codes over WhatsApp, with SMS as a fallback.
- Later: incoming WhatsApp orders land in the Orders inbox as drafts for staff to confirm.

*Cost note:* Meta charges per delivered message; since October 2026 that includes replies inside the 24-hour window. Kenyan rates are cents per message, more for marketing messages. Build a monthly message allowance into each plan, and keep promotional broadcasts opt-in.

### F10 — Customer insights (P1)

The app flags customers who are ordering less often or ordering less, so the owner can call them before they leave.

- For each customer, the app learns their normal pattern from recent history: the usual gap between orders and the average order value.
- **Flags**, shown on the customer list and in a weekly WhatsApp digest to the owner:
    - **Overdue to order:** no order for 1.5× their usual gap (e.g. normally weekly, now 11 days).
    - **Shrinking orders:** average order value over the last 4 weeks is down 25% or more on their previous 8 weeks.
    - **Dropped a product:** they've stopped buying something they ordered regularly.
    - **Growing:** ordering more, worth a thank-you or a better price.
- Each flag has one-tap actions: call, or send a WhatsApp check-in.
- The Reports tab adds simple trends: active customers this month vs last, revenue by customer, and the top 5 customers at risk.
- Flags only start after a customer has 4+ orders, and the thresholds are editable under More.

*Acceptance:* each weekly digest lists every customer who has gone quiet or is ordering less, with their usual vs current pattern in plain words (e.g. "usually orders weekly, last order 12 days ago").

## Subscription and pricing

Suppliers pay; customers order for free (the same split Choco uses). Prices are starting hypotheses to test in pilot interviews.

| Plan | Price (KES / month) | For | Includes |
| --- | --- | --- | --- |
| Free trial | 0 for 30 days | Every new supplier | Full Growth plan |
| Starter | 1,500 | Single-person or very small supplier | 1 user, up to 100 products, customer link, manual payment logging |
| Growth | 3,500 | Typical wholesale supplier | Up to 5 staff, M-Pesa auto-detection, delivery zones, daily summary |
| Business | 7,500 | Larger supplier, several outlets | Unlimited staff, multiple branches, reports and export, priority support |

- **Billing:** M-Pesa STK push each month, with an option to pay 12 months for the price of 10.
- **Pilot offer:** the first 10 suppliers get 3 months free in return for weekly feedback.
- **Do not** charge per order or take a commission in Phase 1.
- **Later revenue (Phase 2/3):** customers pay for the multi-supplier app, suppliers pay for featured listings, anonymised market and price insights.

## Technical approach

Build one mobile-first web app (a PWA) instead of native apps. It installs to the home screen from a link, works on cheap Android phones, skips app-store approval, and the customer order page shares the same code.

**Stack**

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js (React) + Tailwind, PWA with offline cache | One codebase for the supplier app and customer page; installable; fast on 3G |
| Backend and database | Supabase (Postgres, auth, storage, edge functions) | Phone OTP login, row-level security per supplier, file storage for product photos |
| Hosting | Vercel | Simple deploys; preview links for testing with pilot suppliers |
| Payments | Manual + SMS-paste logging; optional Safaricom Daraja C2B notifications | Tracks payments into the supplier's own accounts; SokoFresh never holds funds |
| Messaging | WhatsApp share links now; WhatsApp Cloud API + SMS fallback (e.g. Africa's Talking) in P1 | Alerts where users already are |
| Languages | i18n with English and Swahili string files | Swahili from day one |

**Payment tracking (no money handled)**

- **Principle:** SokoFresh records payments and never collects, holds or moves customer money.
- **Core path: manual entry.** Staff record amount, method (cash, M-Pesa, bank), reference and date, then allocate to one or more orders, oldest first by default.
- **M-Pesa SMS paste:** staff paste a confirmation SMS; the app extracts transaction code, amount, sender and time, and suggests the matching order.
- **Optional auto-detection (Till/Paybill):** with the supplier's permission, the Daraja C2B Register URL API sends read-only notifications of payments into the supplier's own shortcode. Match by account reference, then payer phone + amount; unmatched goes to a **To match** list.
- **Bank transfers:** recorded by hand with a reference; bank statement CSV import later.
- **Reliability:** store every raw notification, deduplicate on transaction ID, never auto-confirm a match without a staff tap in Phase 1.
- **SokoFresh's own subscription** is the only payment SokoFresh initiates: an STK push to SokoFresh's Paybill.

**Core data model** — see `supabase/migrations/0001_init.sql`. Every row belongs to one `supplier_id`, enforced by row-level security.

**Data protection (Kenya)**

- The app stores customers' names, phone numbers and locations on behalf of suppliers, so the company is a data processor for suppliers (and a controller for its own users). Check ODPC registration requirements with a local lawyer before launch (exemption exists below KES 5M turnover and under 10 employees).
- Include a data processing agreement in the supplier terms.
- Customers give consent on the order page, can request deletion, and the Phase 3 directory never exposes customer data.

## Milestones, risks and open questions

**Build milestones** (about 12 weeks to a paid pilot) — task-level breakdown in `docs/BUILD_PLAN.md`.

| Weeks | Milestone | Done when |
| --- | --- | --- |
| 1–2 | Discovery | 8–10 supplier interviews; 3 suppliers agree to pilot; price and feature list confirmed |
| 3–5 | Core app | F1 onboarding, F2 stock, F4 orders in English and Swahili; installable PWA |
| 6–7 | Customer link + delivery | F3 and F5 live; first real customer order through a link |
| 8–9 | Payments | F6 terms, credit and tracking; F9 WhatsApp share buttons; Daraja auto-detection with 1 pilot supplier |
| 10 | Billing | F7 subscription STK push, trial, grace period, read-only mode |
| 11–12 | Pilot | 3–5 suppliers live; weekly feedback; fix the top 10 issues |
| 13+ | Launch | First paying suppliers; F8 daily summary, F9 automated WhatsApp, F10 customer insights |

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Staff don't use it and fall back to WhatsApp | Churn | Test with real staff every sprint; log WhatsApp orders in under a minute |
| No automatic payment detection for some suppliers | Less automation | Manual and SMS-paste logging are the core path; auto-detection is a bonus |
| Many suppliers use personal Send Money | No auto-matching | SMS-paste parsing; help suppliers apply for a Till during onboarding |
| Suppliers won't pay a subscription | No revenue | Free pilot → show money recovered from unpaid orders; low Starter tier |
| Poor connectivity | Lost updates | Offline-first stock and order screens; small pages; retry queues |
| Data protection compliance | Fines, trust | Registration check and DPA in terms before launch |

**Open questions**

- [ ] **Name:** "SokoFresh" is taken (Nairobi agritech, sokofresh.co.ke). Choose a new name before buying a domain.
- [ ] Which supplier category goes first (produce, meat, beverages, dry goods)?
- [ ] How common is credit, and on what terms? Should a credit limit only warn, or block?
- [ ] Do most target suppliers have a Till/Paybill or use personal M-Pesa?
- [ ] What does each supplier need to do to allow read-only Daraja notifications, and how long does it take?
- [ ] WhatsApp: one SokoFresh number sending on suppliers' behalf, or each supplier's own number? Message allowance per plan?
- [ ] Does KRA eTIMS invoicing matter early?
