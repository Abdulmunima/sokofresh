# SokoFresh (working name)

Phase 1 supplier app for Nairobi wholesale suppliers — stock, orders, delivery days, payment & credit tracking, customer order link, WhatsApp sharing.

> "SokoFresh" is a placeholder: the name is already used by a Nairobi agritech company. Rename before branding.

## What's here

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Rules Claude Code follows in every session (stack, non-negotiables, workflow) |
| `docs/PRD.md` | Product requirements — what to build and why |
| `docs/BUILD_PLAN.md` | Ordered task list (M0 → M8, then P1) with "done when" checks |
| `supabase/migrations/0001_init.sql` | Database schema, triggers, balance views, row-level security (tested on Postgres 16) |

## Getting started with Claude Code

1. Install the tools: Node 20+, pnpm, the Supabase CLI and Docker (for local Supabase), and Git.
2. Unzip this folder, `cd` into it, run `git init`, and commit.
3. Start Claude Code in the folder: `claude`
4. Paste this as your first message:

   > Read CLAUDE.md, docs/PRD.md and docs/BUILD_PLAN.md. Then start M0: do task 0.1 (scaffold the app) and task 0.2 (local Supabase with the existing migration plus a seed file). Keep the existing files. Show me the plan first, then build, run the checks, and tick the tasks off in BUILD_PLAN.md.

5. After each task: try it on your phone (`pnpm dev`, then open your computer's local IP on the same Wi-Fi), commit, and ask for the next task.

## Accounts you'll need later

- **Supabase** project (database + phone login) and **Vercel** (hosting) — both have free tiers.
- **SMS provider** for login codes (e.g. Africa's Talking) — needed by M1.
- **Safaricom Daraja** developer account — sandbox for M7 (subscription STK push) and M8 (optional payment auto-detection).
- **WhatsApp Business Platform** — only for P1 automated messages; Phase 1 share buttons need nothing.
