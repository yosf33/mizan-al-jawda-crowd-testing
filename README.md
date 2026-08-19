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
| Evidence security | Evidence is stored through S3-compatible storage metadata and exposed only through authorization-checked signed URLs to the reporter, linked client, or administrator. |
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
| Server | Express 4, tRPC 11, Manus OAuth |
| Data | MySQL/TiDB via Drizzle ORM |
| Storage | S3-compatible object storage with signed download URLs |
| Tests | Vitest |

## Local setup

### Prerequisites

Use Node.js 22+ and `pnpm`. The application requires the runtime variables supplied by the Manus full-stack template, particularly `DATABASE_URL`, OAuth settings, and storage credentials.

### Install and run

```bash
pnpm install
pnpm dev
```

The development server starts the full Express and Vite application.

### Database migrations

The source schema is in `drizzle/schema.ts`. Generate migrations after a schema update, inspect the generated SQL, and apply it to the configured database:

```bash
pnpm drizzle-kit generate
# Apply the reviewed migration through the managed database workflow.
```

### Quality checks

```bash
pnpm check
pnpm test
pnpm build
```

## Repository structure

```text
client/                 React RTL user interface
  src/pages/            Landing, onboarding, and role-specific workspaces
  src/components/       Shared dashboard and UI components
server/                 tRPC procedures, security rules, storage integration
drizzle/                Schema and generated database migrations
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

The project is designed for the managed Manus full-stack runtime. Create a validated checkpoint, then use the product interface’s **Publish** control to deploy. Do not commit environment files, credentials, or production database URLs to this repository.

## Status

The project currently includes the full MVP workflow, a production build, TypeScript checks, and automated tests for authentication, financial formatting, role authorization, rejection-reason validation, duplicate-validation requirements, and bug-category validation.
