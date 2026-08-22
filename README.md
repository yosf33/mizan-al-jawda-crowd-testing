# ميزان الجودة — Crowd Testing Platform

**ميزان الجودة** is an Arabic-first, right-to-left crowd-testing and bug-bounty platform. It connects software clients with vetted testers, routes each defect through independent triage and client approval, and keeps the related rewards, payouts, reputation, and evidence access traceable.

The public experience is designed with a sacred-geometry visual system: warm cream surfaces, refined golden construction lines, and dark-navy typography. The product interface is fully Arabic and RTL.

## Product capabilities

| Area | Included functionality |
|---|---|
| Public product site | Arabic RTL landing page, dual tester/client calls to action, and the required **Pay per Valid Bug** and **100+ devices** highlights. |
| Roles | Protected tester, client, and administrator workspaces. Administrators are granted through platform administration rather than public self-elevation. |
| Tester workflow | Device registration, payout-method configuration, active-cycle browsing, wallet views, report tracking, evidence uploads, and payout requests. |
| Client workflow | Project and cycle creation, scope and build-link management, severity-specific bounty rates, and final approval or written rejection of triaged reports. |
| Triage workflow | The exact actions **Approve**, **Request Changes**, and **Mark Duplicate**. Duplicate handling requires both the original report reference and a written reason. |
| Financial controls | Separate pending and available wallet balances, immutable-style transaction entries, payout debits/reversals, and administrator payout processing. |
| Reputation | Reputation events are issued when reports are approved or rejected, and aggregate tester scores are maintained. |
| Evidence security | Evidence is stored in a private Supabase Storage bucket and exposed only through authorization-checked signed URLs to the reporter, linked client, or administrator. |
| Notifications | In-app notification records for bug decisions, triage updates, and payout processing. |

## Workflow

```text
Client creates project + cycle + bounty rates
                    ↓
Tester submits structured report + private evidence
                    ↓
Administrator triages: Approve / Request Changes / Mark Duplicate
                    ↓
Client approves or rejects (written reason required for rejection)
                    ↓
Wallet and reputation update → tester may request payout
```

## Bug report contract

The bug-report form validates the following seven fields before submission:

1. Title
2. Category: `Functional`, `UI`, `Performance`, or `Crash`
3. Severity: `Critical`, `Major`, or `Minor`
4. Steps to reproduce
5. Expected result
6. Actual result
7. Evidence uploads, including supported screenshots, video, crash logs, or archive files

The server verifies that the selected device belongs to the tester, that the test cycle is active, and that attached evidence was uploaded by the same tester before linking it to the report.

## Technology

| Layer | Stack |
|---|---|
| Client | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod, Wouter |
| Server | Express 4, tRPC 11, Supabase Auth JWT verification |
| Data | Supabase PostgreSQL via Drizzle ORM and the transaction pooler |
| Storage | Private Supabase Storage bucket with signed download URLs |
| Tests | Vitest |

## Local setup

### Prerequisites

Use Node.js 22+ and `pnpm`. Copy `.env.example` to `.env` and set the required Supabase and public-application values. Keep all secrets out of browser variables and source control.

| Variable | Where it is used | Visibility |
|---|---|---|
| `SUPABASE_URL` | Server Supabase client | Server only |
| `SUPABASE_SECRET_KEY` | Storage operations and protected server actions | Server only |
| `DATABASE_URL` | PostgreSQL transaction-pooler connection | Server only |
| `SUPABASE_PUBLISHABLE_KEY` | Server-side JWT validation fallback | Server only |
| `VITE_SUPABASE_URL` | Browser Supabase client | Public browser configuration |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client | Public browser configuration |
| `PUBLIC_APP_URL` | Optional future redirect and allowed-origin configuration | Server only |

### Install and run

```bash
pnpm install
pnpm dev
```

The development server starts the standalone Express and Vite application. Its deployment health endpoint is [`/healthz`](http://localhost:3000/healthz).

### Database migrations

The application-owned migration history is in `supabase/migrations/`. Apply migrations to the target Supabase project in order and keep the generated database schema, RLS policies, private evidence bucket, and migration files in sync.

```bash
# Inspect and apply the next reviewed SQL file through Supabase migration tooling.
```

### Quality checks

```bash
pnpm check
pnpm test
pnpm build
pnpm run vercel:build
```

## Repository structure

```text
client/                 React RTL user interface
  src/pages/            Landing, onboarding, and role-specific workspaces
  src/components/       Shared dashboard and UI components
server/                 Standalone Express server, tRPC procedures, Supabase auth and storage integration
api/[...path].ts        Vercel Function entry point for `/api/*`
supabase/migrations/    Application-owned PostgreSQL schema, storage, and RLS migrations
vercel.json             Static SPA output, API routing, security headers, and deep-link fallback
shared/                 Shared types and application constants
```

## Security and business rules

The platform enforces the following rules at the server boundary rather than relying solely on the UI:

* Clients can only decide reports belonging to their own projects.
* A client rejection cannot be submitted without a written reason of at least 12 characters.
* Duplicate triage cannot be submitted without a same-cycle original-report reference and a written reason.
* Payout requests deduct only from available balance; rejected payout requests automatically reverse that deduction.
* A bounty moves from pending to available only after a client approves a triaged report.
* Evidence URLs are generated only after checking that the requester is the report owner, the linked client, or an administrator.

## Deployment

Deploy the repository to Vercel as a Vite static build plus a Node.js Function under `/api/*`. In Vercel Project Settings, configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `DATABASE_URL` as server-only values and `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` as browser-safe build values for both **Preview** and **Production**. `DATABASE_URL` must use the Supabase transaction pooler and be URI encoded. Do not configure the migration-only `SUPABASE_DATABASE_URL` variable in Vercel.

The Vercel build command is `pnpm run vercel-build`, with the static output in `dist/public`. The Vercel Function exposes `/api/health` and `/api/trpc`, while the route configuration preserves those API paths and sends non-API deep links such as `/workspace` to the RTL SPA entry page. Verify the generated Vercel URL before configuring it as the exact Supabase Auth Site URL and production redirect URL; do not attach or switch a custom domain without separate written approval.

For a Supabase Free-tier MVP, keep the product invitation-only, enforce evidence upload-size limits, and monitor Storage, database, egress, function duration, and failed authentication activity. Vercel’s Hobby plan is appropriate for a private, non-commercial rehearsal; use a Vercel plan appropriate to commercial operation before onboarding paying clients or paying testers. The application is stateless and reconnects through Supabase’s transaction pooler. See the [Vercel Hobby plan documentation](https://vercel.com/docs/plans/hobby) and [Supabase Free plan limits](https://supabase.com/pricing).

Do not commit `.env` files, database URIs, Supabase Secret API keys, or production credentials to this repository. See `docs/portable-runtime-configuration.md` and `supabase/README.md` for the deployment and migration sequence.

## Status

The project currently includes the full MVP workflow, Supabase PostgreSQL schema and default-deny RLS migrations, Vercel Function and SPA configuration, a production build, TypeScript checks, and automated tests for authentication, Supabase credential and database connectivity, Vercel routing, financial formatting, role authorization, rejection-reason validation, duplicate-validation requirements, and bug-category validation. A live Vercel deployment and its acceptance evidence remain pending.
