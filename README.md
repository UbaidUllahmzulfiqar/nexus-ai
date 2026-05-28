# Nexus AI

Nexus AI is a Next.js App Router SaaS for authenticated document upload, processing, chat, and workspace-scoped document management.

## Overview

- App Router + TypeScript frontend and server components
- Prisma v7 with PostgreSQL
- NextAuth-based authentication with dev JWT bootstrap support
- Document upload, text extraction, persisted summaries, and document chat
- Workspace-scoped dashboard and document access controls

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL access

### Environment

Create a `.env` file from `.env.example`.

Required production variables:

```bash
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
APP_JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Also required by the app in production:

```bash
GITHUB_ID=
GITHUB_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_TEAM=
STRIPE_PORTAL_RETURN_URL=
INTERNAL_AUTH_SECRET=
ALLOW_DEV_BOOTSTRAP_CONTEXT=
DEFAULT_APP_USER_EMAIL=
DEFAULT_WORKSPACE_SLUG=
DEFAULT_WORKSPACE_NAME=
MAX_STORED_CONTENT_CHARS=
OPENAI_BASE_URL=
```

### Install and Run

```bash
npm install
npx prisma generate
npm run build
npm test
npm run dev
```

### Validation

```bash
npm install
npx prisma generate
npm run build
npm test
```

## Production Deployment

### Prisma

- Use migrations in production.
- Run `npx prisma migrate deploy` against the production database.
- Do not use `npx prisma db push` for production deploys.
- The build script runs `prisma generate` before `next build`.

### Vercel

1. Import the GitHub repository into Vercel.
2. Set the production environment variables listed above.
3. Set `NEXTAUTH_URL` to the deployed Vercel domain.
4. Use the default build command, which runs `npm run build`.
5. Deploy once, then verify `/api/health`, sign-in, uploads, and billing flows.

### Supabase

1. Create a Supabase project.
2. Copy the runtime connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL` if you want migrations to bypass pooling.
3. Apply the schema with `npx prisma migrate deploy`.
4. Use the same production database connection string in Vercel.
5. Confirm the app can read and write users, workspaces, and documents.

### Stripe

1. Create the product and prices for Pro and Team.
2. Copy the live secret key into `STRIPE_SECRET_KEY`.
3. Copy the price IDs into `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_TEAM`.
4. Create a webhook endpoint for `https://<your-domain>/api/billing/webhook`.
5. Subscribe that endpoint to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
6. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Auth Notes

- `GET/POST /api/auth/[...nextauth]` handles NextAuth sessions.
- `POST /api/auth/login` is a dev-only JWT bootstrap route when `ALLOW_DEV_BOOTSTRAP_CONTEXT=true`.
- `src/lib/actor-context.ts` prefers NextAuth session tokens and falls back to bearer JWT or trusted headers for local workflows.

## Document Workflow

1. Upload a PDF at `/dashboard/upload`.
2. The upload API creates a document row and moves it through `UPLOADED -> PROCESSING -> COMPLETE` or `FAILED`.
3. Extracted content and summaries are stored in the database.
4. The dashboard lists workspace-scoped documents.
5. The document detail page shows metadata, extracted text, summary, and chat history.
6. The document chat API streams grounded answers using stored content.

## Health Check

- `GET /api/health` returns a simple JSON status payload for uptime checks.

## Release Notes

### Current Product State

- Authentication scaffold implemented
- Protected dashboard implemented
- Document processing and summaries implemented
- Document chat implemented
- Build and tests pass locally

### Remaining Production Work

- Monitoring and rate limiting hardening
- Final UX polish
- Production deployment and release automation

### Billing Notes

- `/pricing` shows the subscription tiers and posts to the Stripe checkout route.
- `/api/billing/webhook` syncs subscription state back into workspace records.
- `/api/billing/portal` opens the Stripe customer portal for the active workspace.

### Launch Checklist

- Verify production environment variables in the host dashboard.
- Confirm Prisma points at the production PostgreSQL database.
- Confirm NextAuth sign-in redirects work on the deployed domain.
- Confirm the health endpoint returns `200`.
- Confirm build, test, and migration steps are documented before release.
